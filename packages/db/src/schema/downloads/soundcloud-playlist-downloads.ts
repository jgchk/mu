import type { InferModel } from 'drizzle-orm'
import { blob, integer, sqliteTable, uniqueIndex } from 'drizzle-orm/sqlite-core'
import type { Playlist as SoundcloudPlaylist } from 'soundcloud'

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
