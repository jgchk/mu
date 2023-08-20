import { eq } from 'drizzle-orm'
import { withProps } from 'utils'

import type { InsertSession, Session } from '../schema/sessions'
import { sessions } from '../schema/sessions'
import type { AutoCreatedAt } from '../utils'
import { withCreatedAt } from '../utils'
import type { DatabaseBase } from './base'

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
