import SqliteDatabase from 'better-sqlite3'
import { placeholder, sql } from 'drizzle-orm'
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { and, desc, eq, isNull } from 'drizzle-orm/expressions'

import { migrate } from './migrate'
import type {
  Artist,
  Config,
  InsertArtist,
  InsertConfig,
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
  configs,
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

export class Database {
  private sqlite: SqliteDatabase.Database
  private db: BetterSQLite3Database
  private preparedQueries: ReturnType<typeof makePreparedQueries>

  constructor(url: string) {
    this.sqlite = new SqliteDatabase(url)
    this.db = drizzle(this.sqlite)
    migrate(this.db)

    this.preparedQueries = makePreparedQueries(this.db)
  }

  close() {
    this.sqlite.close()
  }

  configs = {
    insert: (config: InsertConfig) => {
      return this.db.insert(configs).values(config).returning().get()
    },

    get: () => {
      return this.db.select().from(configs).limit(1).all().at(0) ?? this.configs.default
    },

    update: (data: UpdateData<InsertConfig>) => {
      const config = this.configs.get()
      if ('id' in config) {
        const update = {
          ...(data.lastFmKey !== undefined ? { lastFmKey: data.lastFmKey } : {}),
          ...(data.lastFmSecret !== undefined ? { lastFmSecret: data.lastFmSecret } : {}),
          ...(data.lastFmUsername !== undefined ? { lastFmUsername: data.lastFmUsername } : {}),
          ...(data.lastFmPassword !== undefined ? { lastFmPassword: data.lastFmPassword } : {}),
          ...(data.soulseekUsername !== undefined
            ? { soulseekUsername: data.soulseekUsername }
            : {}),
          ...(data.soulseekPassword !== undefined
            ? { soulseekPassword: data.soulseekPassword }
            : {}),
          ...(data.spotifyClientId !== undefined ? { spotifyClientId: data.spotifyClientId } : {}),
          ...(data.spotifyClientSecret !== undefined
            ? { spotifyClientSecret: data.spotifyClientSecret }
            : {}),
          ...(data.spotifyUsername !== undefined ? { spotifyUsername: data.spotifyUsername } : {}),
          ...(data.spotifyPassword !== undefined ? { spotifyPassword: data.spotifyPassword } : {}),
          ...(data.spotifyDcCookie !== undefined ? { spotifyDcCookie: data.spotifyDcCookie } : {}),
          ...(data.soundcloudAuthToken !== undefined
            ? { soundcloudAuthToken: data.soundcloudAuthToken }
            : {}),
        }
        return this.db.update(configs).set(update).returning().get()
      } else {
        const insert: InsertConfig = {
          lastFmKey: data.lastFmKey ?? this.configs.default.lastFmKey,
          lastFmSecret: data.lastFmSecret ?? this.configs.default.lastFmSecret,
          lastFmUsername: data.lastFmUsername ?? this.configs.default.lastFmUsername,
          lastFmPassword: data.lastFmPassword ?? this.configs.default.lastFmPassword,
          soulseekUsername: data.soulseekUsername ?? this.configs.default.soulseekUsername,
          soulseekPassword: data.soulseekPassword ?? this.configs.default.soulseekPassword,
          spotifyClientId: data.spotifyClientId ?? this.configs.default.spotifyClientId,
          spotifyClientSecret: data.spotifyClientSecret ?? this.configs.default.spotifyClientSecret,
          spotifyUsername: data.spotifyUsername ?? this.configs.default.spotifyUsername,
          spotifyPassword: data.spotifyPassword ?? this.configs.default.spotifyPassword,
          spotifyDcCookie: data.spotifyDcCookie ?? this.configs.default.spotifyDcCookie,
          soundcloudAuthToken: data.soundcloudAuthToken ?? this.configs.default.soundcloudAuthToken,
        }
        return this.db.insert(configs).values(insert).returning().get()
      }
    },

    default: {
      lastFmKey: null,
      lastFmSecret: null,
      lastFmUsername: null,
      lastFmPassword: null,
      soulseekUsername: null,
      soulseekPassword: null,
      spotifyClientId: null,
      spotifyClientSecret: null,
      spotifyUsername: null,
      spotifyPassword: null,
      spotifyDcCookie: null,
      soundcloudAuthToken: null,
    } satisfies Omit<Config, 'id'>,
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
  }

  releaseArtists = {
    insertMany: (releaseArtists_: InsertReleaseArtist[]) => {
      if (releaseArtists_.length === 0) return []
      return this.db
        .insert(releaseArtists)
        .values(...releaseArtists_)
        .returning()
        .all()
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

    getByArtistWithArtists: (artistId: ReleaseArtist['artistId']) => {
      const releases_ = this.db
        .select()
        .from(releases)
        .innerJoin(releaseArtists, eq(releases.id, releaseArtists.releaseId))
        .where(eq(releaseArtists.artistId, artistId))
        .orderBy(releases.title)
        .all()
      return releases_.map((row) => {
        const artists = this.artists.getByReleaseId(row.releases.id)
        return { ...row.releases, artists }
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
      return this.db
        .insert(trackArtists)
        .values(...trackArtists_)
        .returning()
        .all()
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
        ...(data.coverArtHash !== undefined ? { coverArtHash: data.coverArtHash } : {}),
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

    getByArtistWithArtists: (artistId: Artist['id']) => {
      const tracks_ = this.db
        .select()
        .from(tracks)
        .innerJoin(trackArtists, eq(tracks.id, trackArtists.trackId))
        .where(eq(trackArtists.artistId, artistId))
        .orderBy(tracks.title)
        .all()
      return tracks_.map((row) => {
        const artists = this.artists.getByTrackId(row.tracks.id)
        return { ...convertTrack(row.tracks), artists }
      })
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
      const tracks = this.playlistTracks.getByPlaylistId(id)
      return { ...playlist, tracks }
    },

    getAll: () => {
      return this.db.select().from(playlists).all()
    },

    update: (id: Playlist['id'], data: UpdateData<InsertPlaylist>) => {
      const update = {
        ...(data.name !== undefined ? { name: data.name } : {}),
      }
      return this.db.update(playlists).set(update).where(eq(playlists.id, id)).returning().get()
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

    getByPlaylistId: (playlistId: PlaylistTrack['playlistId']) => {
      return this.db
        .select()
        .from(playlistTracks)
        .where(eq(playlistTracks.playlistId, playlistId))
        .orderBy(playlistTracks.order)
        .all()
    },

    delete: (playlistId: PlaylistTrack['playlistId'], trackId: PlaylistTrack['trackId']) => {
      return this.db
        .delete(playlistTracks)
        .where(and(eq(playlistTracks.playlistId, playlistId), eq(playlistTracks.trackId, trackId)))
        .run()
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
}
