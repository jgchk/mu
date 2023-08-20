import type { InferModel } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export type Release = InferModel<typeof releases>
export type InsertRelease = InferModel<typeof releases, 'insert'>
export const releases = sqliteTable('releases', {
  id: integer('id').primaryKey(),
  title: text('title'),
})
