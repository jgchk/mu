import type { InferModel } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export type Image = InferModel<typeof images>
export type InsertImage = InferModel<typeof images, 'insert'>
export const images = sqliteTable('images', {
  id: integer('id').primaryKey(),
  hash: text('hash').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})
