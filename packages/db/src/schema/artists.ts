import type { InferModel } from 'drizzle-orm'
import { relations } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import { images } from './images'
import { releaseArtists } from './release-artists'
import { trackArtists } from './track-artists'

export type Artist = InferModel<typeof artists>
export type InsertArtist = InferModel<typeof artists, 'insert'>
export const artists = sqliteTable('artists', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  imageId: integer('image_id').references(() => images.id),
})

export const artistRelations = relations(artists, ({ many }) => ({
  releaseArtists: many(releaseArtists),
  trackArtists: many(trackArtists),
}))
