import type { InferModel } from 'drizzle-orm'
import { and, eq, isNull } from 'drizzle-orm'
import { blob, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import type { FullTrack as SoundcloudFullTrack } from 'soundcloud'
import type { Constructor } from 'utils'

import type { AutoCreatedAt, UpdateData } from '../../utils'
import { makeUpdate, withCreatedAt } from '../../utils'
import type { DatabaseBase } from '../base'
import type { DownloadStatus } from '.'
import { soundcloudPlaylistDownloads } from './soundcloud-playlist-downloads'

export type SoundcloudTrackDownload = InferModel<typeof soundcloudTrackDownloads>
export type InsertSoundcloudTrackDownload = InferModel<typeof soundcloudTrackDownloads, 'insert'>
export const soundcloudTrackDownloads = sqliteTable(
  'soundcloud_track_downloads',
  {
    id: integer('id').primaryKey(),
    trackId: integer('track_id').notNull(),
    track: blob('track', { mode: 'json' }).$type<SoundcloudFullTrack>(),
    path: text('path'),
    status: text('status').$type<DownloadStatus>().notNull(),
    progress: integer('progress'),
    error: blob('error', { mode: 'json' }),
    playlistDownloadId: integer('playlist_download_id').references(
      () => soundcloudPlaylistDownloads.id
    ),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  },
  (soundcloudTrackDownloads) => ({
    trackIdPlaylistIdUniqueIndex: uniqueIndex('trackIdPlaylistIdUniqueIndex').on(
      soundcloudTrackDownloads.trackId,
      soundcloudTrackDownloads.playlistDownloadId
    ),
  })
)

export type SoundcloudTrackDownloadsMixin = {
  soundcloudTrackDownloads: {
    insert: (
      soundcloudTrackDownload: AutoCreatedAt<InsertSoundcloudTrackDownload>
    ) => SoundcloudTrackDownload
    update: (
      id: SoundcloudTrackDownload['id'],
      data: UpdateData<InsertSoundcloudTrackDownload>
    ) => SoundcloudTrackDownload
    get: (id: SoundcloudTrackDownload['id']) => SoundcloudTrackDownload
    getByPlaylistDownloadId: (
      playlistDownloadId: SoundcloudTrackDownload['playlistDownloadId']
    ) => SoundcloudTrackDownload[]
    getByTrackIdAndPlaylistDownloadId: (
      trackId: SoundcloudTrackDownload['trackId'],
      playlistDownloadId: SoundcloudTrackDownload['playlistDownloadId']
    ) => SoundcloudTrackDownload | undefined
    getAll: () => SoundcloudTrackDownload[]
    delete: (id: SoundcloudTrackDownload['id']) => void
  }
}

export const SoundcloudTrackDownloadsMixin = <TBase extends Constructor<DatabaseBase>>(
  Base: TBase
): Constructor<SoundcloudTrackDownloadsMixin> & TBase =>
  class extends Base implements SoundcloudTrackDownloadsMixin {
    soundcloudTrackDownloads: SoundcloudTrackDownloadsMixin['soundcloudTrackDownloads'] = {
      insert: (soundcloudTrackDownload) => {
        return this.db
          .insert(soundcloudTrackDownloads)
          .values(withCreatedAt(soundcloudTrackDownload))
          .returning()
          .get()
      },

      update: (id, data) => {
        return this.db
          .update(soundcloudTrackDownloads)
          .set(makeUpdate(data))
          .where(eq(soundcloudTrackDownloads.id, id))
          .returning()
          .get()
      },

      get: (id) => {
        return this.db
          .select()
          .from(soundcloudTrackDownloads)
          .where(eq(soundcloudTrackDownloads.id, id))
          .get()
      },

      getByPlaylistDownloadId: (playlistDownloadId) => {
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

      getByTrackIdAndPlaylistDownloadId: (trackId, playlistDownloadId) => {
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

      delete: (id) => {
        return this.db
          .delete(soundcloudTrackDownloads)
          .where(eq(soundcloudTrackDownloads.id, id))
          .run()
      },
    }
  }
