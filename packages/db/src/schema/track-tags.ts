import type { InferModel } from 'drizzle-orm'
import { relations } from 'drizzle-orm'
import { integer, primaryKey, sqliteTable } from 'drizzle-orm/sqlite-core'

import { tags } from './tags'
import { tracks } from './tracks'

export type TrackTag = InferModel<typeof trackTags>
export type InsertTrackTag = InferModel<typeof trackTags, 'insert'>
export const trackTags = sqliteTable(
  'track_tags',
  {
    trackId: integer('track_id')
      .references(() => tracks.id, { onDelete: 'cascade' })
      .notNull(),
    tagId: integer('tag_id')
      .references(() => tags.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (trackTags) => ({
    trackTagsPrimaryKey: primaryKey(trackTags.trackId, trackTags.tagId),
  })
)

export const trackTagRelations = relations(trackTags, ({ one }) => ({
  track: one(tracks, {
    fields: [trackTags.trackId],
    references: [tracks.id],
  }),
  tag: one(tags, {
    fields: [trackTags.tagId],
    references: [tags.id],
  }),
}))
