import { eq } from 'drizzle-orm'
import { withProps } from 'utils'

import type { Account, InsertAccount } from '../schema/accounts'
import { accounts } from '../schema/accounts'
import type { AutoCreatedAt, UpdateData } from '../utils'
import { hasUpdate, makeUpdate, withCreatedAt } from '../utils'
import type { DatabaseBase } from './base'

export type AccountsMixin = {
  accounts: {
    insert: (account: AutoCreatedAt<InsertAccount>) => Account
    get: (id: Account['id']) => Account | undefined
    findByUsername: (username: Account['username']) => Account | undefined
    update: (id: Account['id'], data: UpdateData<Account>) => Account | undefined
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
