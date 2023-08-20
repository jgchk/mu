import type { InferModel } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import { accounts } from './accounts'

export type Session = InferModel<typeof sessions>
export type InsertSession = InferModel<typeof sessions, 'insert'>
export const sessions = sqliteTable('sessions', {
  token: text('token').notNull().primaryKey(),
  accountId: integer('account_id')
    .notNull()
    .references(() => accounts.id),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})
