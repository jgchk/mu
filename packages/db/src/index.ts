import { and, eq, isNull } from 'drizzle-orm/expressions'
import { pipe } from 'utils'

import type {
  InsertSoulseekReleaseDownload,
  InsertSoulseekTrackDownload,
  SoulseekReleaseDownload,
  SoulseekTrackDownload,
} from './schema'
import {
  ConfigMixin,
  ImagesMixin,
  soulseekReleaseDownloads,
  soulseekTrackDownloads,
} from './schema'
import { ArtistsMixin } from './schema/artists'
import { DatabaseBase } from './schema/base'
import { SoundcloudPlaylistDownloadsMixin } from './schema/downloads/soundcloud-playlist-downloads'
import { SoundcloudTrackDownloadsMixin } from './schema/downloads/soundcloud-track-downloads'
import { SpotifyAlbumDownloadsMixin } from './schema/downloads/spotify-album-downloads'
import { SpotifyTrackDownloadsMixin } from './schema/downloads/spotify-track-downloads'
import { PlaylistTracksMixin } from './schema/playlist-tracks'
import { PlaylistsMixin } from './schema/playlists'
import { ReleaseArtistsMixin } from './schema/release-artists'
import { ReleasesMixin } from './schema/releases'
import { TrackArtistsMixin } from './schema/track-artists'
import { TracksMixin } from './schema/tracks'
import type { AutoCreatedAt, UpdateData } from './utils'
import { makeUpdate, withCreatedAt } from './utils'

export * from './schema'

class DatabaseOriginal extends DatabaseBase {
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
      return this.db
        .update(soulseekReleaseDownloads)
        .set(makeUpdate(data))
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
      return this.db
        .update(soulseekTrackDownloads)
        .set(makeUpdate(data))
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

const DatabaseClass = pipe(
  DatabaseOriginal,
  ConfigMixin,
  ImagesMixin,
  ArtistsMixin,
  ReleaseArtistsMixin,
  ReleasesMixin,
  TrackArtistsMixin,
  TracksMixin,
  PlaylistsMixin,
  PlaylistTracksMixin,
  SoundcloudPlaylistDownloadsMixin,
  SoundcloudTrackDownloadsMixin,
  SpotifyAlbumDownloadsMixin,
  SpotifyTrackDownloadsMixin
)

export const Database = (url: string) => new DatabaseClass(url)

export type Database = ReturnType<typeof Database>
