import type { InferModel } from 'drizzle-orm'
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

export type Account = InferModel<typeof accounts>
export type InsertAccount = InferModel<typeof accounts, 'insert'>
export const accounts = sqliteTable(
  'accounts',
  {
    id: integer('id').primaryKey(),
    username: text('username').notNull(),
    passwordHash: text('password_hash').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  },
  (accounts) => ({
    accountsUsernameUniqueIndex: uniqueIndex('accountsUsernameUniqueIndex').on(accounts.username),
  })
)
