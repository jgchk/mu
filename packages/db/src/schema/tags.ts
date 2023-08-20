import type { InferModel } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export type Tag = InferModel<typeof tags>
export type InsertTag = InferModel<typeof tags, 'insert'> & {
  parents?: Tag['id'][]
  children?: Tag['id'][]
}
export const tags = sqliteTable('tags', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  taggable: integer('taggable').notNull(),
})
