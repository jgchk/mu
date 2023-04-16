import { TRPCError } from '@trpc/server'
import { toErrorString } from 'utils'

import { t } from './trpc'

export const isLastFmAvailable = t.middleware(({ next, ctx }) => {
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

export const isSoulseekAvailable = t.middleware(({ next, ctx }) => {
  const slsk = ctx.slsk

  if (slsk.status === 'stopped') {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Soulseek is not running',
    })
  } else if (slsk.status === 'errored') {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `Soulseek ran into an error: ${toErrorString(slsk.error)}`,
      cause: slsk.error,
    })
  } else if (slsk.status === 'logging-in') {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Soulseek is logging in',
    })
  }

  return next({
    ctx: {
      slsk,
    },
  })
})
