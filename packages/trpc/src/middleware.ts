import { TRPCError } from '@trpc/server'

import { t } from './trpc'

export const isLastFmAuthenticated = t.middleware(({ next, ctx }) => {
  const lfm = ctx.lfm

  if (!lfm.available) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Last.fm is not available',
      cause: lfm.error,
    })
  }
  if (!lfm.loggedIn) {
    if (lfm.error) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Last.fm login failed',
        cause: lfm.error,
      })
    } else {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Not logged in to Last.fm',
      })
    }
  }

  return next({
    ctx: {
      lfm,
    },
  })
})
