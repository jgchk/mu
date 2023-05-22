import type { InferModel } from 'drizzle-orm'
import { and, eq, isNull } from 'drizzle-orm'
import { blob, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import type { FullTrack as SoundcloudFullTrack } from 'soundcloud'
import { ifDefined, withProps } from 'utils'

import type { DownloadStatus } from '.'
import type { AutoCreatedAt, UpdateData } from '../../utils'
import { hasUpdate, makeUpdate, withCreatedAt } from '../../utils'
import type { DatabaseBase } from '../base'
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

export const SoundcloudTrackDownloadsMixin = <T extends DatabaseBase>(
  base: T
): T & SoundcloudTrackDownloadsMixin => {
  const soundcloudTrackDownloadsMixin: SoundcloudTrackDownloadsMixin['soundcloudTrackDownloads'] = {
    insert: (soundcloudTrackDownload) => {
      return base.db
        .insert(soundcloudTrackDownloads)
        .values(withCreatedAt(soundcloudTrackDownload))
        .returning()
        .get()
    },

    update: (id, data) => {
      const update = makeUpdate({
        ...data,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        error: ifDefined(data.error, (error) =>
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error)))
        ),
      })
      if (!hasUpdate(update)) return soundcloudTrackDownloadsMixin.get(id)
      return base.db
        .update(soundcloudTrackDownloads)
        .set(update)
        .where(eq(soundcloudTrackDownloads.id, id))
        .returning()
        .get()
    },

    get: (id) => {
      return base.db
        .select()
        .from(soundcloudTrackDownloads)
        .where(eq(soundcloudTrackDownloads.id, id))
        .get()
    },

    getByPlaylistDownloadId: (playlistDownloadId) => {
      return base.db
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
      return base.db
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
      return base.db.select().from(soundcloudTrackDownloads).all()
    },

    delete: (id) => {
      return base.db
        .delete(soundcloudTrackDownloads)
        .where(eq(soundcloudTrackDownloads.id, id))
        .run()
    },
  }

  return withProps(base, { soundcloudTrackDownloads: soundcloudTrackDownloadsMixin })
}
