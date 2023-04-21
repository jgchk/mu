import { and, eq, isNull } from 'drizzle-orm/expressions'
import { pipe } from 'utils'

import type {
  InsertSoulseekReleaseDownload,
  InsertSoulseekTrackDownload,
  InsertSoundcloudPlaylistDownload,
  InsertSoundcloudTrackDownload,
  InsertSpotifyAlbumDownload,
  InsertSpotifyTrackDownload,
  SoulseekReleaseDownload,
  SoulseekTrackDownload,
  SoundcloudPlaylistDownload,
  SoundcloudTrackDownload,
  SpotifyAlbumDownload,
  SpotifyTrackDownload,
} from './schema'
import {
  ConfigMixin,
  ImagesMixin,
  soulseekReleaseDownloads,
  soulseekTrackDownloads,
  soundcloudPlaylistDownloads,
  soundcloudTrackDownloads,
  spotifyAlbumDownloads,
  spotifyTrackDownloads,
} from './schema'
import { ArtistsMixin } from './schema/artists'
import { DatabaseBase } from './schema/base'
import { PlaylistTracksMixin } from './schema/playlist-tracks'
import { PlaylistsMixin } from './schema/playlists'
import { ReleaseArtistsMixin } from './schema/release-artists'
import { ReleasesMixin } from './schema/releases'
import { TrackArtistsMixin } from './schema/track-artists'
import { TracksMixin } from './schema/tracks'
import type { AutoCreatedAt, UpdateData } from './utils'
import { withCreatedAt } from './utils'

export * from './schema'

class DatabaseOriginal extends DatabaseBase {
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

export function Database(url: string) {
  const Database = pipe(
    DatabaseOriginal,
    ConfigMixin,
    ImagesMixin,
    ArtistsMixin,
    ReleaseArtistsMixin,
    ReleasesMixin,
    TrackArtistsMixin,
    TracksMixin,
    PlaylistsMixin,
    PlaylistTracksMixin
  )
  return new Database(url)
}

export type Database = ReturnType<typeof Database>
