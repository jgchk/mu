import type { InferModel } from 'drizzle-orm'
import { blob, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import type { FullAlbum as SpotifyFullAlbum } from 'spotify'

export type SpotifyAlbumDownload = InferModel<typeof spotifyAlbumDownloads>
export type InsertSpotifyAlbumDownload = InferModel<typeof spotifyAlbumDownloads, 'insert'>
export const spotifyAlbumDownloads = sqliteTable(
  'spotify_album_downloads',
  {
    id: integer('id').primaryKey(),
    albumId: text('album_id').notNull(),
    album: blob('album', { mode: 'json' }).$type<SpotifyFullAlbum>(),
    error: blob('error', { mode: 'json' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  },
  (spotifyAlbumDownloads) => ({
    albumIdUniqueIndex: uniqueIndex('albumIdUniqueIndex').on(spotifyAlbumDownloads.albumId),
  })
)
