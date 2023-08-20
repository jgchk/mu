import type { InferModel } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import { images } from './images'

export type Artist = InferModel<typeof artists>
export type InsertArtist = InferModel<typeof artists, 'insert'>
export const artists = sqliteTable('artists', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  imageId: integer('image_id').references(() => images.id),
})
