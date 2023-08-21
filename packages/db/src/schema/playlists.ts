import type { InferModel } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import { images } from './images'

export type Playlist = InferModel<typeof playlists>
export type InsertPlaylist = InferModel<typeof playlists, 'insert'>
export const playlists = sqliteTable('playlists', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  imageId: integer('image_id').references(() => images.id),
  filter: text('filter'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})
