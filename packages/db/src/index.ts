import SqliteDatabase from 'better-sqlite3'
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { and, eq, isNull } from 'drizzle-orm/expressions'

import { migrate } from './migrate'
import type {
  InsertArtist,
  InsertRelease,
  InsertReleaseArtist,
  InsertReleaseDownload,
  InsertSoundcloudPlaylistDownload,
  InsertSoundcloudTrackDownload,
  InsertTrackArtist,
  InsertTrackDownloadPretty,
  InsertTrackPretty,
  Release,
  ReleaseArtist,
  ReleaseDownload,
  SoundcloudPlaylistDownload,
  SoundcloudTrackDownload,
  Track,
  TrackArtist,
  TrackDownload,
} from './schema'
import {
  artists,
  convertInsertTrack,
  convertInsertTrackDownload,
  convertTrack,
  convertTrackDownload,
  releaseArtists,
  releaseDownloads,
  releases,
  soundcloudPlaylistDownloads,
  soundcloudTrackDownloads,
  trackArtists,
  trackDownloads,
  tracks,
} from './schema'

export * from './schema'

export class Database {
  private sqlite: SqliteDatabase.Database
  private db: BetterSQLite3Database

  constructor(url: string) {
    this.sqlite = new SqliteDatabase(url)
    this.db = drizzle(this.sqlite)
    migrate(this.db)
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

    getByName: (name: string) => {
      return this.db.select().from(artists).where(eq(artists.name, name)).all()
    },

    getByReleaseId: (releaseId: ReleaseArtist['releaseId']) => {
      const results = this.db
        .select()
        .from(releaseArtists)
        .innerJoin(artists, eq(releaseArtists.artistId, artists.id))
        .where(eq(releaseArtists.releaseId, releaseId))
        .all()
      return results.map((result) => ({ ...result.artists, order: result.release_artists.order }))
    },

    getByTrackId: (trackId: TrackArtist['trackId']) => {
      const results = this.db
        .select()
        .from(trackArtists)
        .innerJoin(artists, eq(trackArtists.artistId, artists.id))
        .where(eq(trackArtists.trackId, trackId))
        .all()
      return results.map((result) => ({ ...result.artists, order: result.track_artists.order }))
    },
  }

  releaseArtists = {
    insertMany: (releaseArtists_: InsertReleaseArtist[]) => {
      return this.db
        .insert(releaseArtists)
        .values(...releaseArtists_)
        .returning()
        .get()
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

  releaseDownloads = {
    insert: (releaseDownload: InsertReleaseDownload) => {
      return (
        this.db
          .insert(releaseDownloads)
          // HACK: This is a temporary fix for a Drizzle error where inserting an empty value errors out
          .values({ ...releaseDownload, name: releaseDownload.name ?? null })
          .returning()
          .get()
      )
    },

    update: (id: ReleaseDownload['id'], data: Partial<Omit<InsertReleaseDownload, 'id'>>) => {
      const update = {
        ...(data.name !== undefined ? { name: data.name } : {}),
      }
      return this.db
        .update(releaseDownloads)
        .set(update)
        .where(eq(releaseDownloads.id, id))
        .returning()
        .get()
    },

    getAll: () => {
      return this.db.select().from(releaseDownloads).all()
    },

    get: (id: ReleaseDownload['id']) => {
      return this.db.select().from(releaseDownloads).where(eq(releaseDownloads.id, id)).get()
    },

    delete: (id: ReleaseDownload['id']) => {
      return this.db.delete(releaseDownloads).where(eq(releaseDownloads.id, id)).run()
    },
  }

  releases = {
    insert: (release: InsertRelease) => {
      return this.db.insert(releases).values(release).returning().get()
    },

    insertWithArtists: (data: InsertRelease & { artists?: ReleaseArtist['artistId'][] }) => {
      const { artists: artistsData, ...releaseData } = data
      const release = this.releases.insert(releaseData)
      if (artistsData?.length) {
        this.releaseArtists.insertMany(
          artistsData.map((artistId, order) => ({ releaseId: release.id, artistId, order }))
        )
      }
      const artists = this.artists.getByReleaseId(release.id)
      return { ...release, artists }
    },

    update: (id: Release['id'], data: Partial<Omit<InsertRelease, 'id'>>) => {
      const update = {
        ...(data.title !== undefined ? { title: data.title } : {}),
      }
      return this.db.update(releases).set(update).where(eq(releases.id, id)).returning().get()
    },

    updateWithArtists: (
      id: Release['id'],
      data: Partial<Omit<InsertRelease, 'id'>> & { artists?: ReleaseArtist['artistId'][] }
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

    get: (id: Release['id']) => {
      return this.db.select().from(releases).where(eq(releases.id, id)).get()
    },

    getWithArtists: (id: Release['id']) => {
      const release = this.releases.get(id)
      if (release === undefined) {
        return undefined
      }
      const artists = this.artists.getByReleaseId(id)
      return { ...release, artists }
    },

    delete: (id: Release['id']) => {
      return this.db.delete(releases).where(eq(releases.id, id)).run()
    },
  }

  trackArtists = {
    insertMany: (trackArtists_: InsertTrackArtist[]) => {
      return this.db
        .insert(trackArtists)
        .values(...trackArtists_)
        .returning()
        .get()
    },

    getByTrackId: (trackId: TrackArtist['trackId']) => {
      return this.db.select().from(trackArtists).where(eq(trackArtists.trackId, trackId)).all()
    },

    deleteByTrackId: (trackId: TrackArtist['trackId']) => {
      return this.db.delete(trackArtists).where(eq(trackArtists.trackId, trackId)).run()
    },
  }

  trackDownloads = {
    insert: (trackDownload: InsertTrackDownloadPretty) => {
      return convertTrackDownload(
        this.db
          .insert(trackDownloads)
          .values(convertInsertTrackDownload(trackDownload))
          .returning()
          .get()
      )
    },

    update: (id: TrackDownload['id'], data: Partial<Omit<InsertTrackDownloadPretty, 'id'>>) => {
      const update = {
        ...(data.complete !== undefined ? { complete: data.complete ? 1 : 0 } : {}),
        ...(data.path !== undefined ? { path: data.path } : {}),
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.releaseDownloadId !== undefined
          ? { releaseDownloadId: data.releaseDownloadId }
          : {}),
      }
      return convertTrackDownload(
        this.db
          .update(trackDownloads)
          .set(update)
          .where(eq(trackDownloads.id, id))
          .returning()
          .get()
      )
    },

    getAll: () => {
      return this.db.select().from(trackDownloads).all().map(convertTrackDownload)
    },

    get: (id: TrackDownload['id']) => {
      return convertTrackDownload(
        this.db.select().from(trackDownloads).where(eq(trackDownloads.id, id)).get()
      )
    },

    getByReleaseDownloadId: (
      releaseDownloadId: NonNullable<TrackDownload['releaseDownloadId']>
    ) => {
      return this.db
        .select()
        .from(trackDownloads)
        .where(eq(trackDownloads.releaseDownloadId, releaseDownloadId))
        .all()
        .map(convertTrackDownload)
    },

    getByComplete: (complete: boolean) => {
      return this.db
        .select()
        .from(trackDownloads)
        .where(eq(trackDownloads.complete, complete ? 1 : 0))
        .all()
        .map(convertTrackDownload)
    },

    delete: (id: TrackDownload['id']) => {
      return this.db.delete(trackDownloads).where(eq(trackDownloads.id, id)).run()
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

    update: (id: Track['id'], data: Partial<Omit<InsertTrackPretty, 'id'>>) => {
      const update = {
        ...(data.path !== undefined ? { path: data.path } : {}),
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.releaseId !== undefined ? { releaseId: data.releaseId } : {}),
        ...(data.hasCoverArt !== undefined ? { hasCoverArt: data.hasCoverArt ? 1 : 0 } : {}),
      }
      return convertTrack(
        this.db.update(tracks).set(update).where(eq(tracks.id, id)).returning().get()
      )
    },

    updateWithArtists: (
      id: Track['id'],
      data: Partial<Omit<InsertTrackPretty, 'id'>> & { artists?: TrackArtist['artistId'][] }
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

    getByReleaseId: (releaseId: NonNullable<Track['releaseId']>) => {
      return this.db
        .select()
        .from(tracks)
        .where(eq(tracks.releaseId, releaseId))
        .all()
        .map(convertTrack)
    },

    get: (id: Track['id']) => {
      return convertTrack(this.db.select().from(tracks).where(eq(tracks.id, id)).get())
    },

    getWithArtists: (id: Track['id']) => {
      const track = this.tracks.get(id)
      const artists = this.artists.getByTrackId(id)
      return { ...track, artists }
    },

    delete: (id: Track['id']) => {
      return this.db.delete(tracks).where(eq(tracks.id, id)).run()
    },
  }

  soundcloudPlaylistDownloads = {
    insert: (soundcloudPlaylistDownload: InsertSoundcloudPlaylistDownload) => {
      return this.db
        .insert(soundcloudPlaylistDownloads)
        .values(soundcloudPlaylistDownload)
        .returning()
        .get()
    },

    update: (
      id: SoundcloudPlaylistDownload['id'],
      data: Partial<Omit<InsertSoundcloudPlaylistDownload, 'id'>>
    ) => {
      const update = {
        ...(data.playlistId !== undefined ? { playlistId: data.playlistId } : {}),
        ...(data.playlist !== undefined ? { playlist: data.playlist } : {}),
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
    insert: (soundcloudTrackDownload: InsertSoundcloudTrackDownload) => {
      return this.db
        .insert(soundcloudTrackDownloads)
        .values(soundcloudTrackDownload)
        .returning()
        .get()
    },

    update: (
      id: SoundcloudTrackDownload['id'],
      data: Partial<Omit<InsertSoundcloudTrackDownload, 'id'>>
    ) => {
      const update = {
        ...(data.trackId !== undefined ? { trackId: data.trackId } : {}),
        ...(data.track !== undefined ? { track: data.track } : {}),
        ...(data.path !== undefined ? { path: data.path } : {}),
        ...(data.progress !== undefined ? { progress: data.progress } : {}),
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

    getByPlaylistId: (playlistId: SoundcloudTrackDownload['playlistDownloadId']) => {
      return this.db
        .select()
        .from(soundcloudTrackDownloads)
        .where(
          playlistId === null
            ? isNull(soundcloudTrackDownloads.playlistDownloadId)
            : eq(soundcloudTrackDownloads.playlistDownloadId, playlistId)
        )
        .all()
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
      playlistId: SoundcloudTrackDownload['playlistDownloadId']
    ) => {
      return this.db
        .select()
        .from(soundcloudTrackDownloads)
        .where(
          and(
            eq(soundcloudTrackDownloads.trackId, trackId),
            playlistId === null
              ? isNull(soundcloudTrackDownloads.playlistDownloadId)
              : eq(soundcloudTrackDownloads.playlistDownloadId, playlistId)
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
}
