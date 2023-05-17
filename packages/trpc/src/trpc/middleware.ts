import { TRPCError } from '@trpc/server'
import { toErrorString } from 'utils'

import { t } from './t'

export const isLoggedIn = t.middleware(({ next, ctx }) => {
  const token = ctx.token

  if (token === undefined) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Not logged in',
    })
  }

  const session = ctx.sys().db.sessions.findByToken(token)

  if (session === undefined) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Not logged in',
    })
  }

  return next({ ctx: { session } })
})

export const isLastFmLoggedIn = t.middleware(({ next, ctx }) => {
  const lfm = ctx.sys().lfm

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

  return next({ ctx: { lfm } })
})

export const isSoulseekAvailable = t.middleware(({ next, ctx }) => {
  const slsk = ctx.sys().slsk

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

  return next({ ctx: { slsk } })
})

export const isSpotifyWebApiAvailable = t.middleware(({ next, ctx }) => {
  const sp = ctx.sys().sp

  if (sp.status === 'stopped') {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Spotify is not running',
    })
  } else if (sp.status === 'starting') {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Spotify is starting',
    })
  } else if (sp.status === 'errored') {
    if (sp.errors.webApi) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Spotify ran into an error: ${toErrorString(sp.errors.webApi)}`,
        cause: sp.errors.webApi,
      })
    } else {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Spotify is not configured to use the Web API',
      })
    }
  } else if (sp.status === 'degraded' && sp.errors.webApi) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `Spotify ran into an error: ${toErrorString(sp.errors.webApi)}`,
      cause: sp.errors.webApi,
    })
  } else if (!sp.webApi) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Spotify is not configured to use the Web API',
    })
  }

  return next({ ctx: { sp } })
})

export const isSoundcloudAvailable = t.middleware(({ next, ctx }) => {
  const sc = ctx.sys().sc

  if (sc.status === 'stopped') {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'SoundCloud is not running',
    })
  } else if (sc.status === 'starting') {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'SoundCloud is starting',
    })
  } else if (sc.status === 'errored') {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `SoundCloud ran into an error: ${toErrorString(sc.error)}`,
      cause: sc.error,
    })
  }

  return next({ ctx: { sc } })
})

export const isSpotifyFriendActivityAvailable = t.middleware(({ next, ctx }) => {
  const sp = ctx.sys().sp

  if (sp.status === 'stopped') {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Spotify is not running',
    })
  } else if (sp.status === 'starting') {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Spotify is starting',
    })
  } else if (sp.status === 'errored') {
    if (sp.errors.friendActivity) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Spotify ran into an error: ${toErrorString(sp.errors.friendActivity)}`,
        cause: sp.errors.friendActivity,
      })
    } else {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Spotify is not configured to use the Friend Activity API',
      })
    }
  } else if (sp.status === 'degraded' && sp.errors.friendActivity) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `Spotify ran into an error: ${toErrorString(sp.errors.friendActivity)}`,
      cause: sp.errors.friendActivity,
    })
  } else if (!sp.friendActivity) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Spotify is not configured to use the Friend Activity API',
    })
  }

  return next({ ctx: { sp } })
})
