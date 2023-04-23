import type { InferModel } from 'drizzle-orm'
import { and, eq, inArray } from 'drizzle-orm'
import { integer, primaryKey, sqliteTable } from 'drizzle-orm/sqlite-core'
import type { Constructor } from 'utils'

import type { DatabaseBase } from './base'
import { tags } from './tags'
import { tracks } from './tracks'

export type TrackTag = InferModel<typeof trackTags>
export type InsertTrackTag = InferModel<typeof trackTags, 'insert'>
export const trackTags = sqliteTable(
  'track_tags',
  {
    trackId: integer('track_id')
      .references(() => tracks.id)
      .notNull(),
    tagId: integer('tag_id')
      .references(() => tags.id)
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
    delete: (trackId: TrackTag['trackId'], tagId: TrackTag['tagId']) => void
    deleteByTrackId: (trackId: TrackTag['trackId']) => void
  }
}

export const TrackTagsMixin = <TBase extends Constructor<DatabaseBase>>(
  Base: TBase
): Constructor<TrackTagsMixin> & TBase =>
  class extends Base implements TrackTagsMixin {
    trackTags: TrackTagsMixin['trackTags'] = {
      insert: (trackTag) => {
        return this.db.insert(trackTags).values(trackTag).returning().get()
      },
      insertMany: (trackTags_) => {
        if (trackTags_.length === 0) return []
        return this.db.insert(trackTags).values(trackTags_).returning().all()
      },
      insertManyByTrackId: (trackId, tagIds) => {
        return this.trackTags.insertMany(tagIds.map((tagId) => ({ trackId, tagId })))
      },
      updateByTrackId: (trackId, tagIds) => {
        this.trackTags.deleteByTrackId(trackId)
        return this.trackTags.insertManyByTrackId(trackId, tagIds)
      },
      addTag: (trackId, tagId) => {
        return this.trackTags.insert({ trackId, tagId })
      },
      getByTags: (tagIds) => {
        return this.db.select().from(trackTags).where(inArray(trackTags.tagId, tagIds)).all()
      },
      delete: (trackId, tagId) => {
        return this.db
          .delete(trackTags)
          .where(and(eq(trackTags.trackId, trackId), eq(trackTags.tagId, tagId)))
          .run()
      },
      deleteByTrackId: (trackId) => {
        return this.db.delete(trackTags).where(eq(trackTags.trackId, trackId)).run()
      },
    }
  }
