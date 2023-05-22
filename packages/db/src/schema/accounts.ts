import type { InferModel } from 'drizzle-orm'
import { eq } from 'drizzle-orm'
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { withProps } from 'utils'

import type { AutoCreatedAt, UpdateData } from '../utils'
import { hasUpdate, makeUpdate, withCreatedAt } from '../utils'
import type { DatabaseBase } from './base'

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

export type AccountsMixin = {
  accounts: {
    insert: (account: AutoCreatedAt<InsertAccount>) => Account
    get: (id: Account['id']) => Account
    findByUsername: (username: Account['username']) => Account | undefined
    update: (id: Account['id'], data: UpdateData<Account>) => Account
    isEmpty: () => boolean
  }
}

export const AccountsMixin = <T extends DatabaseBase>(base: T): T & AccountsMixin => {
  const accountsMixin: AccountsMixin['accounts'] = {
    insert: (account) => {
      return base.db.insert(accounts).values(withCreatedAt(account)).returning().get()
    },

    get: (id) => {
      return base.db.select().from(accounts).where(eq(accounts.id, id)).get()
    },

    findByUsername: (username) => {
      return base.db
        .select()
        .from(accounts)
        .where(eq(accounts.username, username))
        .limit(1)
        .all()
        .at(0)
    },

    update: (id, data) => {
      const update = makeUpdate(data)
      if (!hasUpdate(update)) return accountsMixin.get(id)
      return base.db.update(accounts).set(update).where(eq(accounts.id, id)).returning().get()
    },

    isEmpty: () => {
      return base.db.select().from(accounts).limit(1).all().length === 0
    },
  }

  return withProps(base, { accounts: accountsMixin })
}
