import type { InferModel } from 'drizzle-orm'
import { relations } from 'drizzle-orm'
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

import { images } from './images'
import { releases } from './releases'
import { trackArtists } from './track-artists'

export type Track = InferModel<typeof tracks>
export type InsertTrack = InferModel<typeof tracks, 'insert'>
export const tracks = sqliteTable(
  'tracks',
  {
    id: integer('id').primaryKey(),
    path: text('path').notNull(),
    title: text('title'),
    releaseId: integer('release_id').references(() => releases.id),
    order: integer('order').notNull(),
    duration: integer('duration').notNull(),
    favorite: integer('favorite').notNull(),
    imageId: integer('image_id').references(() => images.id),
  },
  (tracks) => ({
    pathUniqueIndex: uniqueIndex('pathUniqueIndex').on(tracks.path),
  })
)

export const trackRelations = relations(tracks, ({ one, many }) => ({
  release: one(releases, {
    fields: [tracks.releaseId],
    references: [releases.id],
  }),
  trackArtists: many(trackArtists),
}))

export type TrackPretty = Omit<Track, 'favorite'> & {
  favorite: boolean
}
export type InsertTrackPretty = Omit<InsertTrack, 'favorite'> & {
  favorite?: boolean
}

export const convertInsertTrack = (track: InsertTrackPretty): InsertTrack => ({
  ...track,
  favorite: track.favorite ? 1 : 0,
})
export const convertTrack = (track: Track): TrackPretty => ({
  ...track,
  favorite: track.favorite !== 0,
})
