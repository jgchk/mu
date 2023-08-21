import { and, eq, inArray } from 'drizzle-orm'
import { withProps } from 'utils'

import type { InsertReleaseTag, ReleaseTag } from '../schema/release-tags'
import { releaseTags } from '../schema/release-tags'
import type { DatabaseBase } from './base'

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
    find: (releaseId: ReleaseTag['releaseId'], tagId: ReleaseTag['tagId']) => ReleaseTag | undefined
    delete: (releaseId: ReleaseTag['releaseId'], tagId: ReleaseTag['tagId']) => void
    deleteByReleaseId: (releaseId: ReleaseTag['releaseId']) => void
  }
}

export const ReleaseTagsMixin = <T extends DatabaseBase>(base: T): T & ReleaseTagsMixin => {
  const releaseTagsMixin: ReleaseTagsMixin['releaseTags'] = {
    insert: (releaseTag) => {
      return base.db.insert(releaseTags).values(releaseTag).returning().get()
    },
    insertMany: (releaseTags_) => {
      if (releaseTags_.length === 0) return []
      return base.db.insert(releaseTags).values(releaseTags_).returning().all()
    },
    insertManyByReleaseId: (releaseId, tagIds) => {
      return releaseTagsMixin.insertMany(tagIds.map((tagId) => ({ releaseId, tagId })))
    },
    updateByReleaseId: (releaseId, tagIds) => {
      releaseTagsMixin.deleteByReleaseId(releaseId)
      return releaseTagsMixin.insertManyByReleaseId(releaseId, tagIds)
    },
    addTag: (releaseId, tagId) => {
      return releaseTagsMixin.insert({ releaseId, tagId })
    },
    getByTags: (tagIds) => {
      return base.db.select().from(releaseTags).where(inArray(releaseTags.tagId, tagIds)).all()
    },
    find: (releaseId, tagId) => {
      return base.db
        .select()
        .from(releaseTags)
        .where(and(eq(releaseTags.releaseId, releaseId), eq(releaseTags.tagId, tagId)))
        .limit(1)
        .all()
        .at(0)
    },
    delete: (releaseId, tagId) => {
      return base.db
        .delete(releaseTags)
        .where(and(eq(releaseTags.releaseId, releaseId), eq(releaseTags.tagId, tagId)))
        .run()
    },
    deleteByReleaseId: (releaseId) => {
      return base.db.delete(releaseTags).where(eq(releaseTags.releaseId, releaseId)).run()
    },
  }

  return withProps(base, { releaseTags: releaseTagsMixin })
}
