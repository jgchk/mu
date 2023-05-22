import type { InferModel } from 'drizzle-orm'
import { and, eq, inArray } from 'drizzle-orm'
import { integer, primaryKey, sqliteTable } from 'drizzle-orm/sqlite-core'
import { withProps } from 'utils'

import type { DatabaseBase } from './base'
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

export type TrackTagsMixin = {
  trackTags: {
    insert: (trackTag: InsertTrackTag) => TrackTag
    insertMany: (trackTags: InsertTrackTag[]) => TrackTag[]
    insertManyByTrackId: (trackId: TrackTag['trackId'], tagIds: TrackTag['tagId'][]) => TrackTag[]
    updateByTrackId: (trackId: TrackTag['trackId'], tagIds: TrackTag['tagId'][]) => TrackTag[]
    addTag: (trackId: TrackTag['trackId'], tagId: TrackTag['tagId']) => TrackTag
    getByTags: (tagIds: TrackTag['tagId'][]) => TrackTag[]
    find: (trackId: TrackTag['trackId'], tagId: TrackTag['tagId']) => TrackTag | undefined
    delete: (trackId: TrackTag['trackId'], tagId: TrackTag['tagId']) => void
    deleteByTrackId: (trackId: TrackTag['trackId']) => void
  }
}

export const TrackTagsMixin = <T extends DatabaseBase>(base: T): T & TrackTagsMixin => {
  const trackTagsMixin: TrackTagsMixin['trackTags'] = {
    insert: (trackTag) => {
      return base.db.insert(trackTags).values(trackTag).returning().get()
    },
    insertMany: (trackTags_) => {
      if (trackTags_.length === 0) return []
      return base.db.insert(trackTags).values(trackTags_).returning().all()
    },
    insertManyByTrackId: (trackId, tagIds) => {
      return trackTagsMixin.insertMany(tagIds.map((tagId) => ({ trackId, tagId })))
    },
    updateByTrackId: (trackId, tagIds) => {
      trackTagsMixin.deleteByTrackId(trackId)
      return trackTagsMixin.insertManyByTrackId(trackId, tagIds)
    },
    addTag: (trackId, tagId) => {
      return trackTagsMixin.insert({ trackId, tagId })
    },
    getByTags: (tagIds) => {
      return base.db.select().from(trackTags).where(inArray(trackTags.tagId, tagIds)).all()
    },
    find: (trackId, tagId) => {
      return base.db
        .select()
        .from(trackTags)
        .where(and(eq(trackTags.trackId, trackId), eq(trackTags.tagId, tagId)))
        .limit(1)
        .all()
        .at(0)
    },
    delete: (trackId, tagId) => {
      return base.db
        .delete(trackTags)
        .where(and(eq(trackTags.trackId, trackId), eq(trackTags.tagId, tagId)))
        .run()
    },
    deleteByTrackId: (trackId) => {
      return base.db.delete(trackTags).where(eq(trackTags.trackId, trackId)).run()
    },
  }

  return withProps(base, { trackTags: trackTagsMixin })
}
