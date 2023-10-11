import type { InferModel } from 'drizzle-orm'
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

import { tracks } from './tracks'

export type Account = InferModel<typeof accounts>
export type InsertAccount = InferModel<typeof accounts, 'insert'>
export const accounts = sqliteTable(
  'accounts',
  {
    id: integer('id').primaryKey(),
    username: text('username').notNull(),
    passwordHash: text('password_hash').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),

    listeningTrackId: integer('listening_track_id').references(() => tracks.id),
    listeningTrackStartedAt: integer('listening_track_started_at', {
      mode: 'timestamp',
    }),
    listeningTrackCurrentTime: integer('listening_track_current_time'),
    listeningTrackScrobbled: integer('listening_track_scrobbled', { mode: 'boolean' }),
  },
  (accounts) => ({
    accountsUsernameUniqueIndex: uniqueIndex('accountsUsernameUniqueIndex').on(accounts.username),
  })
)
