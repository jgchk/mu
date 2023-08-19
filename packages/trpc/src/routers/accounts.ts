import { TRPCError } from '@trpc/server'
import { compare, hash as hash_ } from 'bcryptjs'
import { randomBytes } from 'crypto'
import type { Account, Database } from 'db'
import { accounts, eq } from 'db'
import { omit } from 'utils'
import { z } from 'zod'

import { publicProcedure, router } from '../trpc'

export const accountsRouter = router({
  register: publicProcedure
    .input(z.object({ username: z.string().min(1), password: z.string().min(1) }))
    .mutation(async ({ ctx, input: { username, password } }) => {
      const noAccountsExist = ctx.sys().db.db.select().from(accounts).limit(1).all().length === 0

      if (!noAccountsExist) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Not authorized to register accounts',
        })
      }

      const passwordHash = await hashPassword(password)
      const account = ctx
        .sys()
        .db.db.insert(accounts)
        .values({ username, passwordHash })
        .returning()
        .get()

      const { token, maxAge } = createSession(ctx.sys().db, account.id)

      return { account: formatAccount(account), token, maxAge }
    }),

  login: publicProcedure
    .input(z.object({ username: z.string().min(1), password: z.string().min(1) }))
    .mutation(async ({ ctx, input: { username, password } }) => {
      const account = await getAccountFromCredentials(ctx.sys().db, username, password)
      if (!account) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid username or password' })
      }

      const { token, maxAge } = createSession(ctx.sys().db, account.id)

      return { token, maxAge }
    }),

  getSession: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(({ ctx, input: { token } }) => {
      const session = ctx.sys().db.sessions.findByToken(token)
      if (session === undefined) {
        return null
      }
      if (session.expiresAt < new Date()) {
        ctx.sys().db.sessions.delete(session.token)
        return null
      }
      return session
    }),

  isEmpty: publicProcedure.query(
    ({ ctx }) => ctx.sys().db.db.select().from(accounts).limit(1).all().length === 0
  ),
})

export const hashPassword = (password: string) => hash_(password, 12)

export type FormattedAccount = ReturnType<typeof formatAccount>
export const formatAccount = (account: Account) => omit(account, ['passwordHash'])

export const getAccountFromCredentials = async (
  db: Database,
  username: string,
  password: string
): Promise<Account | false> => {
  const account = db.db
    .select()
    .from(accounts)
    .where(eq(accounts.username, username))
    .limit(1)
    .all()
    .at(0)

  if (account === undefined) {
    // spend some time to "waste" some time
    // this makes brute forcing harder
    // could also do a timeout here
    await hashPassword(password)
    return false
  }

  const passwordMatches = await compare(password, account.passwordHash)
  if (passwordMatches) {
    return account
  } else {
    return false
  }
}

export const createSession = (db: Database, accountId: number) => {
  const maxAge = 1000 * 60 * 60 * 24 * 30 // 30 days
  const expiresAt = new Date(Date.now() + maxAge) // 30 days
  const token = randomBytes(32).toString('hex')
  db.sessions.insert({ token, accountId, expiresAt })
  return { token, maxAge }
}
