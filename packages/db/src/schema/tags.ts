import type { InferModel } from 'drizzle-orm'
import { integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export type Tag = InferModel<typeof tags>
export type InsertTag = InferModel<typeof tags, 'insert'> & {
  parents?: Tag['id'][]
  children?: Tag['id'][]
}
export const tags = sqliteTable('tags', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  taggable: integer('taggable', { mode: 'boolean' }).notNull(),
})

export type TagRelationship = InferModel<typeof tagRelationships>
export type InsertTagRelationship = InferModel<typeof tagRelationships, 'insert'>
export const tagRelationships = sqliteTable(
  'tag_relationships',
  {
    parentId: integer('parent_id')
      .references(() => tags.id, { onDelete: 'cascade' })
      .notNull(),
    childId: integer('child_id')
      .references(() => tags.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (tagRelationships) => ({
    tagRelationshipsPrimaryKey: primaryKey(tagRelationships.parentId, tagRelationships.childId),
  })
)
