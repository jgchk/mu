import type { InferModel } from 'drizzle-orm'
import { eq } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { withProps } from 'utils'

import type { AutoCreatedAt } from '../utils'
import { withCreatedAt } from '../utils'
import { accounts } from './accounts'
import type { DatabaseBase } from './base'

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

export type SessionsMixin = {
  sessions: {
    insert: (session: AutoCreatedAt<InsertSession>) => Session
    findByToken: (token: Session['token']) => Session | undefined
    delete: (token: Session['token']) => void
  }
}

export const SessionsMixin = <T extends DatabaseBase>(base: T): T & SessionsMixin => {
  const sessionsMixin: SessionsMixin['sessions'] = {
    insert: (session) => {
      return base.db.insert(sessions).values(withCreatedAt(session)).returning().get()
    },

    findByToken: (token) => {
      return base.db.select().from(sessions).where(eq(sessions.token, token)).limit(1).all().at(0)
    },

    delete: (token) => {
      return base.db.delete(sessions).where(eq(sessions.token, token)).run()
    },
  }

  return withProps(base, { sessions: sessionsMixin })
}
