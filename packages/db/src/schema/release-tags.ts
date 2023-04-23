import type { InferModel } from 'drizzle-orm'
import { and, desc, eq, inArray } from 'drizzle-orm'
import { integer, primaryKey, sqliteTable } from 'drizzle-orm/sqlite-core'
import type { Constructor } from 'utils'

import type { DatabaseBase } from './base'
import { releases } from './releases'
import { tags } from './tags'

export type ReleaseTag = InferModel<typeof releaseTags>
export type InsertReleaseTag = InferModel<typeof releaseTags, 'insert'>
export const releaseTags = sqliteTable(
  'release_tags',
  {
    releaseId: integer('release_id')
      .references(() => releases.id)
      .notNull(),
    tagId: integer('tag_id')
      .references(() => tags.id)
      .notNull(),
    order: integer('order').notNull(),
  },
  (releaseTags) => ({
    releaseTagsPrimaryKey: primaryKey(releaseTags.releaseId, releaseTags.tagId),
  })
)

export type ReleaseTagsMixin = {
  releaseTags: {
    insert: (releaseTag: InsertReleaseTag) => ReleaseTag
    insertMany: (releaseTags: InsertReleaseTag[]) => ReleaseTag[]
    insertManyByReleaseId: (
      releaseId: ReleaseTag['releaseId'],
      tagIds: ReleaseTag['tagId'][]
    ) => ReleaseTag[]
    updateByReleaseId: (
      releaseId: ReleaseTag['releaseId'],
      tagIds: ReleaseTag['tagId'][]
    ) => ReleaseTag[]
    addTag: (releaseId: ReleaseTag['releaseId'], tagId: ReleaseTag['tagId']) => ReleaseTag
    getByTags: (tagIds: ReleaseTag['tagId'][]) => ReleaseTag[]
    delete: (releaseId: ReleaseTag['releaseId'], tagId: ReleaseTag['tagId']) => void
    deleteByReleaseId: (releaseId: ReleaseTag['releaseId']) => void
  }
}

export const ReleaseTagsMixin = <TBase extends Constructor<DatabaseBase>>(
  Base: TBase
): Constructor<ReleaseTagsMixin> & TBase =>
  class extends Base implements ReleaseTagsMixin {
    releaseTags: ReleaseTagsMixin['releaseTags'] = {
      insert: (releaseTag) => {
        return this.db.insert(releaseTags).values(releaseTag).returning().get()
      },
      insertMany: (releaseTags_) => {
        if (releaseTags_.length === 0) return []
        return this.db.insert(releaseTags).values(releaseTags_).returning().all()
      },
      insertManyByReleaseId: (releaseId, tagIds) => {
        return this.releaseTags.insertMany(
          tagIds.map((tagId, order) => ({ releaseId, tagId, order }))
        )
      },
      updateByReleaseId: (releaseId, tagIds) => {
        this.releaseTags.deleteByReleaseId(releaseId)
        return this.releaseTags.insertManyByReleaseId(releaseId, tagIds)
      },
      addTag: (releaseId, tagId) => {
        const lastTag = this.db
          .select({ order: releaseTags.order })
          .from(releaseTags)
          .where(eq(releaseTags.releaseId, releaseId))
          .orderBy(desc(releaseTags.order))
          .limit(1)
          .all()
          .at(0)
        const order = lastTag ? lastTag.order + 1 : 0
        return this.releaseTags.insert({ releaseId, tagId, order })
      },
      getByTags: (tagIds) => {
        return this.db.select().from(releaseTags).where(inArray(releaseTags.tagId, tagIds)).all()
      },
      delete: (releaseId, tagId) => {
        return this.db
          .delete(releaseTags)
          .where(and(eq(releaseTags.releaseId, releaseId), eq(releaseTags.tagId, tagId)))
          .run()
      },
      deleteByReleaseId: (releaseId) => {
        return this.db.delete(releaseTags).where(eq(releaseTags.releaseId, releaseId)).run()
      },
    }
  }
