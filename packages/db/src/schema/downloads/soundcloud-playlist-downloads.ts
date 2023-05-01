import type { InferModel } from 'drizzle-orm'
import { eq } from 'drizzle-orm'
import { blob, integer, sqliteTable, uniqueIndex } from 'drizzle-orm/sqlite-core'
import type { Playlist as SoundcloudPlaylist } from 'soundcloud'
import type { Constructor } from 'utils'

import type { AutoCreatedAt, UpdateData } from '../../utils'
import { hasUpdate, makeUpdate, withCreatedAt } from '../../utils'
import type { DatabaseBase } from '../base'

export type SoundcloudPlaylistDownload = InferModel<typeof soundcloudPlaylistDownloads>
export type InsertSoundcloudPlaylistDownload = InferModel<
  typeof soundcloudPlaylistDownloads,
  'insert'
>
export const soundcloudPlaylistDownloads = sqliteTable(
  'soundcloud_playlist_downloads',
  {
    id: integer('id').primaryKey(),
    playlistId: integer('playlist_id').notNull(),
    playlist: blob('playlist', { mode: 'json' }).$type<SoundcloudPlaylist>(),
    error: blob('error', { mode: 'json' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  },
  (soundcloudPlaylistDownloads) => ({
    playlistIdUniqueIndex: uniqueIndex('playlistIdUniqueIndex').on(
      soundcloudPlaylistDownloads.playlistId
    ),
  })
)

export type SoundcloudPlaylistDownloadsMixin = {
  soundcloudPlaylistDownloads: {
    insert: (
      soundcloudPlaylistDownload: AutoCreatedAt<InsertSoundcloudPlaylistDownload>
    ) => SoundcloudPlaylistDownload
    update: (
      id: SoundcloudPlaylistDownload['id'],
      data: UpdateData<InsertSoundcloudPlaylistDownload>
    ) => SoundcloudPlaylistDownload
    get: (id: SoundcloudPlaylistDownload['id']) => SoundcloudPlaylistDownload
    getByPlaylistId: (
      playlistId: SoundcloudPlaylistDownload['playlistId']
    ) => SoundcloudPlaylistDownload | undefined
    getAll: () => SoundcloudPlaylistDownload[]
    delete: (id: SoundcloudPlaylistDownload['id']) => void
  }
}

export const SoundcloudPlaylistDownloadsMixin = <TBase extends Constructor<DatabaseBase>>(
  Base: TBase
): Constructor<SoundcloudPlaylistDownloadsMixin> & TBase =>
  class extends Base implements SoundcloudPlaylistDownloadsMixin {
    soundcloudPlaylistDownloads: SoundcloudPlaylistDownloadsMixin['soundcloudPlaylistDownloads'] = {
      insert: (soundcloudPlaylistDownload) => {
        return this.db
          .insert(soundcloudPlaylistDownloads)
          .values(withCreatedAt(soundcloudPlaylistDownload))
          .returning()
          .get()
      },

      update: (id, data) => {
        const update = makeUpdate(data)
        if (!hasUpdate(update)) return this.soundcloudPlaylistDownloads.get(id)
        return this.db
          .update(soundcloudPlaylistDownloads)
          .set(update)
          .where(eq(soundcloudPlaylistDownloads.id, id))
          .returning()
          .get()
      },

      get: (id) => {
        return this.db
          .select()
          .from(soundcloudPlaylistDownloads)
          .where(eq(soundcloudPlaylistDownloads.id, id))
          .get()
      },

      getByPlaylistId: (playlistId) => {
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

      delete: (id) => {
        return this.db
          .delete(soundcloudPlaylistDownloads)
          .where(eq(soundcloudPlaylistDownloads.id, id))
          .run()
      },
    }
  }
