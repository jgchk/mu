import { TRPCError } from '@trpc/server'
import { toErrorString } from 'utils'

import { t } from './trpc'

export const isLastFmLoggedIn = t.middleware(({ next, ctx }) => {
  const lfm = ctx.lfm

  if (lfm.status === 'stopped') {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Last.fm is not running',
    })
  } else if (lfm.status === 'errored') {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `Last.fm ran into an error: ${toErrorString(lfm.error)}`,
      cause: lfm.error,
    })
  } else if (lfm.status === 'authenticating') {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Last.fm is authenticating',
    })
  } else if (lfm.status === 'authenticated') {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Last.fm is authenticated, but not logged in',
    })
  } else if (lfm.status === 'logging-in') {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Last.fm is logging in',
    })
  } else if (lfm.status === 'degraded') {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `Last.fm is authenticated, but login failed: ${toErrorString(lfm.error)}`,
      cause: lfm.error,
    })
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
