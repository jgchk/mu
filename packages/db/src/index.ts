import { placeholder, sql } from 'drizzle-orm'
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { and, desc, eq, isNull } from 'drizzle-orm/expressions'
import { isNotNull, pipe, uniq } from 'utils'

import type {
  Artist,
  Image,
  InsertArtist,
  InsertImage,
  InsertPlaylist,
  InsertPlaylistTrack,
  InsertRelease,
  InsertReleaseArtist,
  InsertSoulseekReleaseDownload,
  InsertSoulseekTrackDownload,
  InsertSoundcloudPlaylistDownload,
  InsertSoundcloudTrackDownload,
  InsertSpotifyAlbumDownload,
  InsertSpotifyTrackDownload,
  InsertTrackArtist,
  Playlist,
  PlaylistTrack,
  Release,
  ReleaseArtist,
  SoulseekReleaseDownload,
  SoulseekTrackDownload,
  SoundcloudPlaylistDownload,
  SoundcloudTrackDownload,
  SpotifyAlbumDownload,
  SpotifyTrackDownload,
  Track,
  TrackArtist,
} from './schema'
import {
  artists,
  ConfigMixin,
  images,
  playlists,
  playlistTracks,
  releaseArtists,
  releases,
  soulseekReleaseDownloads,
  soulseekTrackDownloads,
  soundcloudPlaylistDownloads,
  soundcloudTrackDownloads,
  spotifyAlbumDownloads,
  spotifyTrackDownloads,
  trackArtists,
  tracks,
} from './schema'
import { DatabaseBase } from './schema/base'
import type { AutoCreatedAt, InsertTrackPretty, UpdateData } from './utils'
import { convertInsertTrack, convertTrack, withCreatedAt } from './utils'

export * from './schema'

const makePreparedQueries = (db: BetterSQLite3Database) =>
  ({
    getArtistsBySimilarName: db
      .select()
      .from(artists)
      .where(sql`lower(${artists.name}) like ${placeholder('name')}`)
      .prepare(),
    getArtistsByNameCaseInsensitive: db
      .select()
      .from(artists)
      .where(sql`lower(${artists.name}) = lower(${placeholder('name')})`)
      .prepare(),
    getTracksBySimilarTitle: db
      .select()
      .from(tracks)
      .where(sql`lower(${tracks.title}) like ${placeholder('title')}`)
      .prepare(),
    getTracksByArtistAndSimilarTitle: db
      .select()
      .from(tracks)
      .where(eq(trackArtists.artistId, placeholder('artistId')))
      .where(sql`lower(${tracks.title}) like ${placeholder('title')}`)
      .prepare(),
  } as const)

class DatabaseOriginal extends DatabaseBase {
  private preparedQueries: ReturnType<typeof makePreparedQueries>

  constructor(url: string) {
    super(url)
    this.preparedQueries = makePreparedQueries(this.db)
  }

  close() {
    this.sqlite.close()
  }

  artists = {
    insert: (artist: InsertArtist) => {
      return this.db.insert(artists).values(artist).returning().get()
    },

    getAll: () => {
      return this.db.select().from(artists).all()
    },

    get: (id: Artist['id']) => {
      return this.db.select().from(artists).where(eq(artists.id, id)).get()
    },

    getByName: (name: Artist['name']) => {
      return this.db.select().from(artists).where(eq(artists.name, name)).all()
    },

    getByNameCaseInsensitive: (name: Artist['name']) => {
      return this.preparedQueries.getArtistsByNameCaseInsensitive.all({ name })
    },

    getBySimilarName: (name: string) => {
      return this.preparedQueries.getArtistsBySimilarName.all({ name: `%${name.toLowerCase()}%` })
    },

    getByReleaseId: (releaseId: ReleaseArtist['releaseId']) => {
      return this.db
        .select()
        .from(releaseArtists)
        .where(eq(releaseArtists.releaseId, releaseId))
        .innerJoin(artists, eq(releaseArtists.artistId, artists.id))
        .orderBy(releaseArtists.order)
        .all()
        .map((result) => ({ ...result.artists, order: result.release_artists.order }))
    },

    getByTrackId: (trackId: TrackArtist['trackId']) => {
      return this.db
        .select()
        .from(trackArtists)
        .where(eq(trackArtists.trackId, trackId))
        .innerJoin(artists, eq(trackArtists.artistId, artists.id))
        .orderBy(trackArtists.order)
        .all()
        .map((row) => ({
          ...row.artists,
          order: row.track_artists.order,
        }))
    },

    update: (id: Artist['id'], data: UpdateData<InsertArtist>) => {
      const update = {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.imageId !== undefined ? { imageId: data.imageId } : {}),
      }
      return this.db.update(artists).set(update).where(eq(artists.id, id)).returning().get()
    },
  }

  releaseArtists = {
    insertMany: (releaseArtists_: InsertReleaseArtist[]) => {
      if (releaseArtists_.length === 0) return []
      return this.db.insert(releaseArtists).values(releaseArtists_).returning().all()
    },

    getByReleaseId: (releaseId: ReleaseArtist['releaseId']) => {
      return this.db
        .select()
        .from(releaseArtists)
        .where(eq(releaseArtists.releaseId, releaseId))
        .all()
    },

    deleteByReleaseId: (releaseId: ReleaseArtist['releaseId']) => {
      return this.db.delete(releaseArtists).where(eq(releaseArtists.releaseId, releaseId)).run()
    },
  }

  releases = {
    insert: (release: InsertRelease) => {
      return this.db.insert(releases).values(release).returning().get()
    },

    insertWithArtists: (data: InsertRelease & { artists?: ReleaseArtist['artistId'][] }) => {
      const { artists: artistsData, ...releaseData } = data
      const release = this.releases.insert(releaseData)
      if (artistsData !== undefined) {
        this.releaseArtists.insertMany(
          artistsData.map((artistId, order) => ({ releaseId: release.id, artistId, order }))
        )
      }
      const artists = this.artists.getByReleaseId(release.id)
      return { ...release, artists }
    },

    update: (id: Release['id'], data: UpdateData<InsertRelease>) => {
      const update = {
        ...(data.title !== undefined ? { title: data.title } : {}),
      }
      return this.db.update(releases).set(update).where(eq(releases.id, id)).returning().get()
    },

    updateWithArtists: (
      id: Release['id'],
      data: UpdateData<InsertRelease & { artists: ReleaseArtist['artistId'][] }>
    ) => {
      const release = this.releases.update(id, data)
      if (data.artists !== undefined) {
        this.releaseArtists.deleteByReleaseId(id)
        this.releaseArtists.insertMany(
          data.artists.map((artistId, order) => ({ releaseId: id, artistId, order }))
        )
      }
      const artists = this.artists.getByReleaseId(id)
      return { ...release, artists }
    },

    getAll: () => {
      return this.db.select().from(releases).all()
    },

    getAllWithArtists: () => {
      return this.db
        .select()
        .from(releases)
        .orderBy(releases.title)
        .all()
        .map((release) => {
          const artists = this.artists.getByReleaseId(release.id)
          return { ...release, artists }
        })
    },

    get: (id: Release['id']) => {
      return this.db.select().from(releases).where(eq(releases.id, id)).get()
    },

    getWithArtists: (id: Release['id']) => {
      const release = this.releases.get(id)
      const artists = this.artists.getByReleaseId(id)
      return { ...release, artists }
    },

    getByArtist: (artistId: ReleaseArtist['artistId']) => {
      return this.db
        .select()
        .from(releases)
        .innerJoin(releaseArtists, eq(releases.id, releaseArtists.releaseId))
        .where(eq(releaseArtists.artistId, artistId))
        .orderBy(releases.title)
        .all()
        .map((row) => row.releases)
    },

    getByArtistWithArtists: (artistId: ReleaseArtist['artistId']) => {
      const releases_ = this.releases.getByArtist(artistId)
      return releases_.map((row) => {
        const artists = this.artists.getByReleaseId(row.id)
        return { ...row, artists }
      })
    },

    getWithTracksAndArtists: (id: Release['id']) => {
      const release = this.releases.getWithArtists(id)
      const tracks = this.tracks.getByReleaseIdWithArtists(id)
      return { ...release, tracks }
    },

    delete: (id: Release['id']) => {
      return this.db.delete(releases).where(eq(releases.id, id)).run()
    },
  }

  trackArtists = {
    insertMany: (trackArtists_: InsertTrackArtist[]) => {
      if (trackArtists_.length === 0) return []
      return this.db.insert(trackArtists).values(trackArtists_).returning().all()
    },

    getByTrackId: (trackId: TrackArtist['trackId']) => {
      return this.db.select().from(trackArtists).where(eq(trackArtists.trackId, trackId)).all()
    },

    deleteByTrackId: (trackId: TrackArtist['trackId']) => {
      return this.db.delete(trackArtists).where(eq(trackArtists.trackId, trackId)).run()
    },
  }

  tracks = {
    insert: (track: InsertTrackPretty) => {
      return convertTrack(
        this.db.insert(tracks).values(convertInsertTrack(track)).returning().get()
      )
    },

    insertWithArtists: (data: InsertTrackPretty & { artists?: TrackArtist['artistId'][] }) => {
      const { artists: artistsData, ...trackData } = data
      const track = this.tracks.insert(trackData)
      if (artistsData !== undefined) {
        this.trackArtists.insertMany(
          artistsData.map((artistId, order) => ({ trackId: track.id, artistId, order }))
        )
      }
      const artists = this.artists.getByTrackId(track.id)
      return { ...track, artists }
    },

    update: (id: Track['id'], data: UpdateData<InsertTrackPretty>) => {
      const update = {
        ...(data.path !== undefined ? { path: data.path } : {}),
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.releaseId !== undefined ? { releaseId: data.releaseId } : {}),
        ...(data.imageId !== undefined ? { imageId: data.imageId } : {}),
        ...(data.favorite !== undefined ? { favorite: data.favorite ? 1 : 0 } : {}),
      }
      return convertTrack(
        this.db.update(tracks).set(update).where(eq(tracks.id, id)).returning().get()
      )
    },

    updateWithArtists: (
      id: Track['id'],
      data: UpdateData<InsertTrackPretty & { artists: TrackArtist['artistId'][] }>
    ) => {
      const track = this.tracks.update(id, data)
      if (data.artists !== undefined) {
        this.trackArtists.deleteByTrackId(id)
        this.trackArtists.insertMany(
          data.artists.map((artistId, order) => ({ trackId: id, artistId, order }))
        )
      }
      const artists = this.artists.getByTrackId(id)
      return { ...track, artists }
    },

    getBySimilarTitle: (title: NonNullable<Track['title']>) => {
      return this.preparedQueries.getTracksBySimilarTitle.all({ title: `%${title.toLowerCase()}%` })
    },

    getByArtist: (artistId: Artist['id']) => {
      return this.db
        .select()
        .from(tracks)
        .innerJoin(trackArtists, eq(tracks.id, trackArtists.trackId))
        .where(eq(trackArtists.artistId, artistId))
        .orderBy(tracks.title)
        .all()
        .map((track) => convertTrack(track.tracks))
    },

    getByArtistAndSimilarTitle: (artistId: Artist['id'], title: NonNullable<Track['title']>) => {
      return this.preparedQueries.getTracksByArtistAndSimilarTitle.all({
        artistId,
        title: `%${title.toLowerCase()}%`,
      })
    },

    getByPath: (path: Track['path']) => {
      const results = this.db.select().from(tracks).where(eq(tracks.path, path)).limit(1).all()
      if (results.length === 0) {
        return undefined
      } else {
        return convertTrack(results[0])
      }
    },

    getWithArtistsByPath: (path: Track['path']) => {
      const track = this.tracks.getByPath(path)
      if (track === undefined) {
        return undefined
      }
      const artists = this.artists.getByTrackId(track.id)
      return { ...track, artists }
    },

    getAll: () => {
      return this.db.select().from(tracks).all().map(convertTrack)
    },

    getAllWithArtistsAndRelease: ({
      favorite,
      skip = 0,
      limit = 50,
    }: { favorite?: boolean; skip?: number; limit?: number } = {}) => {
      let query = this.db.select().from(tracks)

      if (favorite !== undefined) {
        query = query.where(eq(tracks.favorite, favorite ? 1 : 0))
      }

      const allTracks = query
        .offset(skip)
        .leftJoin(releases, eq(tracks.releaseId, releases.id))
        .orderBy(tracks.title)
        .limit(limit)
        .all()

      return allTracks.map((row) => ({
        ...convertTrack(row.tracks),
        release: row.releases,
        artists: this.artists.getByTrackId(row.tracks.id),
      }))
    },

    getByReleaseId: (releaseId: NonNullable<Track['releaseId']>) => {
      return this.db
        .select()
        .from(tracks)
        .where(eq(tracks.releaseId, releaseId))
        .all()
        .map(convertTrack)
    },

    getByReleaseIdWithArtists: (releaseId: NonNullable<Track['releaseId']>) => {
      const releaseTracks = this.db
        .select()
        .from(tracks)
        .where(eq(tracks.releaseId, releaseId))
        .orderBy(tracks.trackNumber)
        .all()

      return releaseTracks.map((track) => ({
        ...convertTrack(track),
        artists: this.artists.getByTrackId(track.id),
      }))
    },

    get: (id: Track['id']) => {
      return convertTrack(this.db.select().from(tracks).where(eq(tracks.id, id)).get())
    },

    getWithArtists: (id: Track['id']) => {
      const track = this.tracks.get(id)
      const artists = this.artists.getByTrackId(id)
      return { ...track, artists }
    },

    getByArtistWithArtistsAndRelease: (artistId: Artist['id']) => {
      const tracks_ = this.db
        .select()
        .from(tracks)
        .innerJoin(trackArtists, eq(tracks.id, trackArtists.trackId))
        .where(eq(trackArtists.artistId, artistId))
        .leftJoin(releases, eq(tracks.releaseId, releases.id))
        .orderBy(tracks.title)
        .all()

      return tracks_.map((row) => ({
        ...convertTrack(row.tracks),
        release: row.releases,
        artists: this.artists.getByTrackId(row.tracks.id),
      }))
    },

    delete: (id: Track['id']) => {
      return this.db.delete(tracks).where(eq(tracks.id, id)).run()
    },
  }

  playlists = {
    insert: (playlist: AutoCreatedAt<InsertPlaylist>) => {
      return this.db.insert(playlists).values(withCreatedAt(playlist)).returning().get()
    },

    insertWithTracks: (playlist: AutoCreatedAt<InsertPlaylist>, trackIds?: Track['id'][]) => {
      const insertedPlaylist = this.playlists.insert(playlist)
      if (trackIds) {
        this.playlistTracks.insertMany(
          trackIds.map((trackId, order) => ({ playlistId: insertedPlaylist.id, trackId, order }))
        )
      }
      const tracks = this.playlistTracks.getByPlaylistId(insertedPlaylist.id)
      return { ...insertedPlaylist, tracks }
    },

    addTrack: (playlistId: Playlist['id'], trackId: Track['id']) => {
      const lastTrack = this.db
        .select()
        .from(playlistTracks)
        .where(eq(playlistTracks.playlistId, playlistId))
        .orderBy(desc(playlistTracks.order))
        .limit(1)
        .all()
        .at(0)
      const order = lastTrack ? lastTrack.order + 1 : 0
      return this.playlistTracks.insert({ playlistId, trackId, order })
    },

    get: (id: Playlist['id']) => {
      return this.db.select().from(playlists).where(eq(playlists.id, id)).get()
    },

    getWithTracks: (id: Playlist['id']) => {
      const playlist = this.playlists.get(id)
      const tracks = this.playlistTracks.getByPlaylistIdWithArtists(id)
      return { ...playlist, tracks }
    },

    getAll: () => {
      return this.db
        .select()
        .from(playlists)
        .all()
        .map((playlist) => {
          const tracks = this.playlistTracks.getByPlaylistId(playlist.id)
          const imageIds = uniq(tracks.map((row) => row.track.imageId).filter(isNotNull))
          return { ...playlist, imageIds }
        })
    },

    update: (id: Playlist['id'], data: UpdateData<InsertPlaylist>) => {
      const update = {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.imageId !== undefined ? { imageId: data.imageId } : {}),
      }
      return this.db.update(playlists).set(update).where(eq(playlists.id, id)).returning().get()
    },

    updateTrackOrder: (playlistTrackIds: PlaylistTrack['id'][]) => {
      playlistTrackIds.forEach((playlistTrackId, i) => {
        this.playlistTracks.update(playlistTrackId, { order: i + 1 })
      })
    },

    delete: (id: Playlist['id']) => {
      return this.db.delete(playlists).where(eq(playlists.id, id)).run()
    },
  }

  playlistTracks = {
    insert: (playlistTrack: AutoCreatedAt<InsertPlaylistTrack>) => {
      return this.db.insert(playlistTracks).values(withCreatedAt(playlistTrack)).returning().get()
    },

    insertMany: (playlistTracks_: AutoCreatedAt<InsertPlaylistTrack>[]) => {
      if (playlistTracks_.length === 0) return []
      return this.db
        .insert(playlistTracks)
        .values(playlistTracks_.map(withCreatedAt))
        .returning()
        .all()
    },

    update: (id: PlaylistTrack['id'], data: UpdateData<InsertPlaylistTrack>) => {
      const update = {
        ...(data.order !== undefined ? { order: data.order } : {}),
      }
      return this.db
        .update(playlistTracks)
        .set(update)
        .where(eq(playlistTracks.id, id))
        .returning()
        .get()
    },

    find: (playlistId: PlaylistTrack['playlistId'], trackId: PlaylistTrack['trackId']) => {
      return this.db
        .select()
        .from(playlistTracks)
        .where(and(eq(playlistTracks.playlistId, playlistId), eq(playlistTracks.trackId, trackId)))
        .limit(1)
        .all()
        .at(0)
    },

    getByPlaylistId: (playlistId: PlaylistTrack['playlistId']) => {
      return this.db
        .select()
        .from(playlistTracks)
        .innerJoin(tracks, eq(playlistTracks.trackId, tracks.id))
        .where(eq(playlistTracks.playlistId, playlistId))
        .orderBy(playlistTracks.order)
        .all()
        .map((track) => ({
          ...track.playlist_tracks,
          track: convertTrack(track.tracks),
        }))
    },

    getByPlaylistIdWithArtists: (playlistId: PlaylistTrack['playlistId']) => {
      return this.playlistTracks.getByPlaylistId(playlistId).map((playlistTrack) => ({
        ...playlistTrack,
        track: {
          ...playlistTrack.track,
          artists: this.artists.getByTrackId(playlistTrack.trackId),
        },
      }))
    },

    delete: (id: PlaylistTrack['id']) => {
      return this.db.delete(playlistTracks).where(eq(playlistTracks.id, id)).run()
    },
  }

  soundcloudPlaylistDownloads = {
    insert: (soundcloudPlaylistDownload: AutoCreatedAt<InsertSoundcloudPlaylistDownload>) => {
      return this.db
        .insert(soundcloudPlaylistDownloads)
        .values(withCreatedAt(soundcloudPlaylistDownload))
        .returning()
        .get()
    },

    update: (
      id: SoundcloudPlaylistDownload['id'],
      data: UpdateData<InsertSoundcloudPlaylistDownload>
    ) => {
      const update = {
        ...(data.playlistId !== undefined ? { playlistId: data.playlistId } : {}),
        ...(data.playlist !== undefined ? { playlist: data.playlist } : {}),
        ...(data.error !== undefined ? { error: data.error } : {}),
      }
      return this.db
        .update(soundcloudPlaylistDownloads)
        .set(update)
        .where(eq(soundcloudPlaylistDownloads.id, id))
        .returning()
        .get()
    },

    get: (id: SoundcloudPlaylistDownload['id']) => {
      return this.db
        .select()
        .from(soundcloudPlaylistDownloads)
        .where(eq(soundcloudPlaylistDownloads.id, id))
        .get()
    },

    getByPlaylistId: (playlistId: SoundcloudPlaylistDownload['playlistId']) => {
      return this.db
        .select()
        .from(soundcloudPlaylistDownloads)
        .where(eq(soundcloudPlaylistDownloads.playlistId, playlistId))
        .limit(1)
        .all()
        .at(0)
    },

    getAll: () => {
      return this.db.select().from(soundcloudPlaylistDownloads).all()
    },

    delete: (id: SoundcloudPlaylistDownload['id']) => {
      return this.db
        .delete(soundcloudPlaylistDownloads)
        .where(eq(soundcloudPlaylistDownloads.id, id))
        .run()
    },
  }

  soundcloudTrackDownloads = {
    insert: (soundcloudTrackDownload: AutoCreatedAt<InsertSoundcloudTrackDownload>) => {
      return this.db
        .insert(soundcloudTrackDownloads)
        .values(withCreatedAt(soundcloudTrackDownload))
        .returning()
        .get()
    },

    update: (
      id: SoundcloudTrackDownload['id'],
      data: UpdateData<InsertSoundcloudTrackDownload>
    ) => {
      const update = {
        ...(data.trackId !== undefined ? { trackId: data.trackId } : {}),
        ...(data.track !== undefined ? { track: data.track } : {}),
        ...(data.path !== undefined ? { path: data.path } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.progress !== undefined ? { progress: data.progress } : {}),
        ...(data.error !== undefined ? { error: data.error } : {}),
        ...(data.playlistDownloadId !== undefined
          ? { playlistDownloadId: data.playlistDownloadId }
          : {}),
      }
      return this.db
        .update(soundcloudTrackDownloads)
        .set(update)
        .where(eq(soundcloudTrackDownloads.id, id))
        .returning()
        .get()
    },

    get: (id: SoundcloudTrackDownload['id']) => {
      return this.db
        .select()
        .from(soundcloudTrackDownloads)
        .where(eq(soundcloudTrackDownloads.id, id))
        .get()
    },

    getByPlaylistDownloadId: (
      playlistDownloadId: SoundcloudTrackDownload['playlistDownloadId']
    ) => {
      return this.db
        .select()
        .from(soundcloudTrackDownloads)
        .where(
          playlistDownloadId === null
            ? isNull(soundcloudTrackDownloads.playlistDownloadId)
            : eq(soundcloudTrackDownloads.playlistDownloadId, playlistDownloadId)
        )
        .all()
    },

    getByTrackIdAndPlaylistDownloadId: (
      trackId: SoundcloudTrackDownload['trackId'],
      playlistDownloadId: SoundcloudTrackDownload['playlistDownloadId']
    ) => {
      return this.db
        .select()
        .from(soundcloudTrackDownloads)
        .where(
          and(
            eq(soundcloudTrackDownloads.trackId, trackId),
            playlistDownloadId === null
              ? isNull(soundcloudTrackDownloads.playlistDownloadId)
              : eq(soundcloudTrackDownloads.playlistDownloadId, playlistDownloadId)
          )
        )
        .limit(1)
        .all()
        .at(0)
    },

    getAll: () => {
      return this.db.select().from(soundcloudTrackDownloads).all()
    },

    delete: (id: SoundcloudTrackDownload['id']) => {
      return this.db
        .delete(soundcloudTrackDownloads)
        .where(eq(soundcloudTrackDownloads.id, id))
        .run()
    },
  }

  spotifyAlbumDownloads = {
    insert: (spotifyAlbumDownload: AutoCreatedAt<InsertSpotifyAlbumDownload>) => {
      return this.db
        .insert(spotifyAlbumDownloads)
        .values(withCreatedAt(spotifyAlbumDownload))
        .returning()
        .get()
    },

    update: (id: SpotifyAlbumDownload['id'], data: UpdateData<InsertSpotifyAlbumDownload>) => {
      const update = {
        ...(data.albumId !== undefined ? { albumId: data.albumId } : {}),
        ...(data.album !== undefined ? { album: data.album } : {}),
        ...(data.error !== undefined ? { error: data.error } : {}),
      }
      return this.db
        .update(spotifyAlbumDownloads)
        .set(update)
        .where(eq(spotifyAlbumDownloads.id, id))
        .returning()
        .get()
    },

    get: (id: SpotifyAlbumDownload['id']) => {
      return this.db
        .select()
        .from(spotifyAlbumDownloads)
        .where(eq(spotifyAlbumDownloads.id, id))
        .get()
    },

    getByAlbumId: (albumId: SpotifyAlbumDownload['albumId']) => {
      return this.db
        .select()
        .from(spotifyAlbumDownloads)
        .where(eq(spotifyAlbumDownloads.albumId, albumId))
        .limit(1)
        .all()
        .at(0)
    },

    getAll: () => {
      return this.db.select().from(spotifyAlbumDownloads).all()
    },

    delete: (id: SpotifyAlbumDownload['id']) => {
      return this.db.delete(spotifyAlbumDownloads).where(eq(spotifyAlbumDownloads.id, id)).run()
    },
  }

  spotifyTrackDownloads = {
    insert: (spotifyTrackDownload: AutoCreatedAt<InsertSpotifyTrackDownload>) => {
      return this.db
        .insert(spotifyTrackDownloads)
        .values(withCreatedAt(spotifyTrackDownload))
        .returning()
        .get()
    },

    update: (id: SpotifyTrackDownload['id'], data: UpdateData<InsertSpotifyTrackDownload>) => {
      const update = {
        ...(data.trackId !== undefined ? { trackId: data.trackId } : {}),
        ...(data.track !== undefined ? { track: data.track } : {}),
        ...(data.path !== undefined ? { path: data.path } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.progress !== undefined ? { progress: data.progress } : {}),
        ...(data.error !== undefined
          ? {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              error: JSON.parse(JSON.stringify(data.error, Object.getOwnPropertyNames(data.error))),
            }
          : {}),
        ...(data.albumDownloadId !== undefined ? { albumDownloadId: data.albumDownloadId } : {}),
      }
      return this.db
        .update(spotifyTrackDownloads)
        .set(update)
        .where(eq(spotifyTrackDownloads.id, id))
        .returning()
        .get()
    },

    get: (id: SpotifyTrackDownload['id']) => {
      return this.db
        .select()
        .from(spotifyTrackDownloads)
        .where(eq(spotifyTrackDownloads.id, id))
        .get()
    },

    getByAlbumDownloadId: (albumDownloadId: SpotifyTrackDownload['albumDownloadId']) => {
      return this.db
        .select()
        .from(spotifyTrackDownloads)
        .where(
          albumDownloadId === null
            ? isNull(spotifyTrackDownloads.albumDownloadId)
            : eq(spotifyTrackDownloads.albumDownloadId, albumDownloadId)
        )
        .all()
    },

    getByTrackIdAndAlbumDownloadId: (
      trackId: SpotifyTrackDownload['trackId'],
      albumDownloadId: SpotifyTrackDownload['albumDownloadId']
    ) => {
      return this.db
        .select()
        .from(spotifyTrackDownloads)
        .where(
          and(
            eq(spotifyTrackDownloads.trackId, trackId),
            albumDownloadId === null
              ? isNull(spotifyTrackDownloads.albumDownloadId)
              : eq(spotifyTrackDownloads.albumDownloadId, albumDownloadId)
          )
        )
        .limit(1)
        .all()
        .at(0)
    },

    getAll: () => {
      return this.db.select().from(spotifyTrackDownloads).all()
    },

    delete: (id: SpotifyTrackDownload['id']) => {
      return this.db.delete(spotifyTrackDownloads).where(eq(spotifyTrackDownloads.id, id)).run()
    },
  }

  soulseekReleaseDownloads = {
    insert: (soulseekReleaseDownload: AutoCreatedAt<InsertSoulseekReleaseDownload>) => {
      return this.db
        .insert(soulseekReleaseDownloads)
        .values(withCreatedAt(soulseekReleaseDownload))
        .returning()
        .get()
    },

    update: (
      id: SoulseekReleaseDownload['id'],
      data: UpdateData<InsertSoulseekReleaseDownload>
    ) => {
      const update = {
        ...(data.username !== undefined ? { username: data.username } : {}),
        ...(data.dir !== undefined ? { dir: data.dir } : {}),
      }
      return this.db
        .update(soulseekReleaseDownloads)
        .set(update)
        .where(eq(soulseekReleaseDownloads.id, id))
        .returning()
        .get()
    },

    get: (id: SoulseekReleaseDownload['id']) => {
      return this.db
        .select()
        .from(soulseekReleaseDownloads)
        .where(eq(soulseekReleaseDownloads.id, id))
        .get()
    },

    getByUsernameAndDir: (
      username: SoulseekReleaseDownload['username'],
      dir: SoulseekReleaseDownload['dir']
    ) => {
      return this.db
        .select()
        .from(soulseekReleaseDownloads)
        .where(
          and(
            eq(soulseekReleaseDownloads.username, username),
            eq(soulseekReleaseDownloads.dir, dir)
          )
        )
        .limit(1)
        .all()
        .at(0)
    },

    getAll: () => {
      return this.db.select().from(soulseekReleaseDownloads).all()
    },

    delete: (id: SoulseekReleaseDownload['id']) => {
      return this.db
        .delete(soulseekReleaseDownloads)
        .where(eq(soulseekReleaseDownloads.id, id))
        .run()
    },
  }

  soulseekTrackDownloads = {
    insert: (soulseekTrackDownload: AutoCreatedAt<InsertSoulseekTrackDownload>) => {
      return this.db
        .insert(soulseekTrackDownloads)
        .values(withCreatedAt(soulseekTrackDownload))
        .returning()
        .get()
    },

    update: (id: SoulseekTrackDownload['id'], data: UpdateData<InsertSoulseekTrackDownload>) => {
      const update = {
        ...(data.username !== undefined ? { username: data.username } : {}),
        ...(data.file !== undefined ? { file: data.file } : {}),
        ...(data.path !== undefined ? { path: data.path } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.progress !== undefined ? { progress: data.progress } : {}),
        ...(data.error !== undefined ? { error: data.error } : {}),
        ...(data.releaseDownloadId !== undefined
          ? { releaseDownloadId: data.releaseDownloadId }
          : {}),
      }
      return this.db
        .update(soulseekTrackDownloads)
        .set(update)
        .where(eq(soulseekTrackDownloads.id, id))
        .returning()
        .get()
    },

    get: (id: SoulseekTrackDownload['id']) => {
      return this.db
        .select()
        .from(soulseekTrackDownloads)
        .where(eq(soulseekTrackDownloads.id, id))
        .get()
    },

    getByReleaseDownloadId: (releaseDownloadId: SoulseekTrackDownload['releaseDownloadId']) => {
      return this.db
        .select()
        .from(soulseekTrackDownloads)
        .where(
          releaseDownloadId === null
            ? isNull(soulseekTrackDownloads.releaseDownloadId)
            : eq(soulseekTrackDownloads.releaseDownloadId, releaseDownloadId)
        )
        .all()
    },

    getByUsernameAndFile: (
      username: SoulseekTrackDownload['username'],
      file: SoulseekTrackDownload['file']
    ) => {
      return this.db
        .select()
        .from(soulseekTrackDownloads)
        .where(
          and(eq(soulseekTrackDownloads.username, username), eq(soulseekTrackDownloads.file, file))
        )
        .limit(1)
        .all()
        .at(0)
    },

    getAll: () => {
      return this.db.select().from(soulseekTrackDownloads).all()
    },

    delete: (id: SoulseekTrackDownload['id']) => {
      return this.db.delete(soulseekTrackDownloads).where(eq(soulseekTrackDownloads.id, id)).run()
    },
  }

  images = {
    insert: (image: AutoCreatedAt<InsertImage>) => {
      return this.db.insert(images).values(withCreatedAt(image)).returning().get()
    },

    get: (id: Image['id']) => {
      return this.db.select().from(images).where(eq(images.id, id)).get()
    },

    getNumberOfUses: (id: Image['id']) => {
      return this.db
        .select({ id: images.id })
        .from(images)
        .where(eq(images.id, id))
        .innerJoin(tracks, eq(images.id, tracks.imageId))
        .innerJoin(playlists, eq(images.id, playlists.imageId))
        .innerJoin(artists, eq(images.id, artists.imageId))
        .all().length
    },

    update: (id: Image['id'], data: UpdateData<InsertImage>) => {
      const update = {
        ...(data.hash !== undefined ? { hash: data.hash } : {}),
      }
      return this.db.update(images).set(update).where(eq(images.id, id)).returning().get()
    },

    delete: (id: Image['id']) => {
      return this.db.delete(images).where(eq(images.id, id)).run()
    },
  }
}

export function Database(url: string) {
  const Database = pipe(DatabaseOriginal, ConfigMixin)
  return new Database(url)
}

export type Database = ReturnType<typeof Database>
