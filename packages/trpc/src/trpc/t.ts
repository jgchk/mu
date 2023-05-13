import { initTRPC } from '@trpc/server'
import type { Context } from 'context'
import superjson from 'superjson'

export const t = initTRPC.context<Context>().create({
  /**
   * @see https://trpc.io/docs/v10/data-transformers
   */
  transformer: superjson,
  /**
   * @see https://trpc.io/docs/v10/error-formatting
   */
  errorFormatter({ shape }) {
    return shape
  },
})
