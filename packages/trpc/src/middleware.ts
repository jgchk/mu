import { TRPCError } from '@trpc/server'
import { toErrorString } from 'utils'

import { t } from './trpc'

export const isLastFmLoggedIn = t.middleware(async ({ next, ctx }) => {
  const status = await ctx.getStatus()
  const lfm = status.lastFm

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

  return next()
})

export const isSoulseekAvailable = t.middleware(async ({ next, ctx }) => {
  const status = await ctx.getStatus()
  const slsk = status.soulseek

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

  return next()
})

export const isSpotifyWebApiAvailable = t.middleware(async ({ next, ctx }) => {
  const status = await ctx.getStatus()
  const sp = status.spotify

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
  } else if (!sp.features.webApi) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Spotify is not configured to use the Web API',
    })
  }

  return next()
})

export const isSoundcloudAvailable = t.middleware(async ({ next, ctx }) => {
  const status = await ctx.getStatus()
  const sc = status.soundcloud

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

  return next()
})

export const isSpotifyFriendActivityAvailable = t.middleware(async ({ next, ctx }) => {
  const status = await ctx.getStatus()
  const sp = status.spotify

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
  } else if (!sp.features.friendActivity) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Spotify is not configured to use the Friend Activity API',
    })
  }

  return next()
})
