import { ifDefined, toErrorString } from 'utils'
import { z } from 'zod'

import type {
  Context,
  ContextLastFm,
  ContextSlsk,
  ContextSpotify,
  ContextSpotifyErrors,
} from '../context'
import { publicProcedure, router } from '../trpc'

export const systemRouter = router({
  status: publicProcedure.query(({ ctx }) => formatStatus(ctx)),
  config: publicProcedure.query(({ ctx }) => ctx.db.configs.get()),
  updateConfig: publicProcedure
    .input(
      z.object({
        lastFmKey: z.string().nullish(),
        lastFmSecret: z.string().nullish(),
        lastFmUsername: z.string().nullish(),
        lastFmPassword: z.string().nullish(),
        soulseekUsername: z.string().nullish(),
        soulseekPassword: z.string().nullish(),
        spotifyClientId: z.string().nullish(),
        spotifyClientSecret: z.string().nullish(),
        spotifyUsername: z.string().nullish(),
        spotifyPassword: z.string().nullish(),
        spotifyDcCookie: z.string().nullish(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updated = ctx.db.configs.update(input)

      if (
        input.lastFmKey !== undefined ||
        input.lastFmSecret !== undefined ||
        input.lastFmUsername !== undefined ||
        input.lastFmPassword !== undefined
      ) {
        await ctx.updateLastFM()
      }

      if (input.soulseekUsername !== undefined || input.soulseekPassword !== undefined) {
        await ctx.startSoulseek()
      }

      if (
        input.spotifyClientId !== undefined ||
        input.spotifyClientSecret !== undefined ||
        input.spotifyUsername !== undefined ||
        input.spotifyPassword !== undefined ||
        input.spotifyDcCookie !== undefined
      ) {
        await ctx.startSpotify()
      }

      return { config: updated, status: formatStatus(ctx) }
    }),
  startSoulseek: publicProcedure.mutation(async ({ ctx }) => {
    const status = await ctx.startSoulseek()
    return formatSlskStatus(status)
  }),
  stopSoulseek: publicProcedure.mutation(({ ctx }) => {
    const status = ctx.stopSoulseek()
    return formatSlskStatus(status)
  }),
  reloadLastFm: publicProcedure.mutation(async ({ ctx }) => {
    const status = await ctx.updateLastFM()
    return formatLastFmStatus(status)
  }),
  startSpotify: publicProcedure.mutation(async ({ ctx }) => {
    const status = await ctx.startSpotify()
    return formatSpotifyStatus(status)
  }),
  stopSpotify: publicProcedure.mutation(({ ctx }) => {
    const status = ctx.stopSpotify()
    return formatSpotifyStatus(status)
  }),
})

const formatStatus = (context: Context) => ({
  lastFm: formatLastFmStatus(context.lfm),
  soulseek: formatSlskStatus(context.slsk),
  spotify: formatSpotifyStatus(context.sp),
})

const formatLastFmStatus = (status: ContextLastFm) =>
  status.status === 'stopped'
    ? ({ status: 'stopped' } as const)
    : status.status === 'errored'
    ? ({ status: 'errored', error: toErrorString(status.error) } as const)
    : status.status === 'authenticating'
    ? ({ status: 'authenticating' } as const)
    : status.status === 'authenticated'
    ? ({ status: 'authenticated' } as const)
    : status.status === 'logging-in'
    ? ({ status: 'logging-in' } as const)
    : status.status === 'degraded'
    ? ({ status: 'degraded', error: toErrorString(status.error) } as const)
    : ({ status: 'logged-in' } as const)

const formatSlskStatus = (status: ContextSlsk) =>
  status.status === 'stopped'
    ? ({ status: 'stopped' } as const)
    : status.status === 'errored'
    ? ({ status: 'errored', error: toErrorString(status.error) } as const)
    : status.status === 'logging-in'
    ? ({ status: 'logging-in' } as const)
    : ({ status: 'logged-in' } as const)

const formatSpotifyStatus = (status: ContextSpotify) =>
  status.status === 'stopped'
    ? ({ status: 'stopped' } as const)
    : status.status === 'starting'
    ? ({ status: 'starting' } as const)
    : status.status === 'errored'
    ? ({ status: 'errored', errors: formatSpotifyErrors(status.errors) } as const)
    : status.status === 'degraded'
    ? ({
        status: 'degraded',
        errors: formatSpotifyErrors(status.errors),
        features: {
          downloads: status.downloads,
          friendActivity: status.friendActivity,
          webApi: status.webApi,
        },
      } as const)
    : ({
        status: 'running',
        features: {
          downloads: status.downloads,
          friendActivity: status.friendActivity,
          webApi: status.webApi,
        },
      } as const)

const formatSpotifyErrors = (errors: ContextSpotifyErrors) => ({
  downloads: ifDefined(errors.downloads, toErrorString),
  friendActivity: ifDefined(errors.friendActivity, toErrorString),
  webApi: ifDefined(errors.webApi, toErrorString),
})
