import type { InferModel } from 'drizzle-orm'
import { relations } from 'drizzle-orm'
import { integer, primaryKey, sqliteTable } from 'drizzle-orm/sqlite-core'

import { releases } from './releases'
import { tags } from './tags'

export type ReleaseTag = InferModel<typeof releaseTags>
export type InsertReleaseTag = InferModel<typeof releaseTags, 'insert'>
export const releaseTags = sqliteTable(
  'release_tags',
  {
    releaseId: integer('release_id')
      .references(() => releases.id, { onDelete: 'cascade' })
      .notNull(),
    tagId: integer('tag_id')
      .references(() => tags.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (releaseTags) => ({
    releaseTagsPrimaryKey: primaryKey(releaseTags.releaseId, releaseTags.tagId),
  })
)

export const releaseTagRelations = relations(releaseTags, ({ one }) => ({
  release: one(releases, {
    fields: [releaseTags.releaseId],
    references: [releases.id],
  }),
  tag: one(tags, {
    fields: [releaseTags.tagId],
    references: [tags.id],
  }),
}))
