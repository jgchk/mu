import type {
  Context,
  ContextLastFm,
  ContextSlsk,
  ContextSoundcloud,
  ContextSpotify,
  ContextSpotifyErrors,
} from 'context'
import { ifDefined, toErrorString } from 'utils'
import { z } from 'zod'

import { publicProcedure, router } from '../trpc'

export const systemRouter = router({
  status: publicProcedure.query(({ ctx }) => formatStatus(ctx)),
  config: publicProcedure.query(({ ctx }) => ctx.db.config.get()),
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
        soundcloudAuthToken: z.string().nullish(),
        downloaderConcurrency: z.number().min(1).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updated = ctx.db.config.update(input)

      if (
        input.lastFmKey !== undefined ||
        input.lastFmSecret !== undefined ||
        input.lastFmUsername !== undefined ||
        input.lastFmPassword !== undefined
      ) {
        await ctx.startLastFm()
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

      if (input.soundcloudAuthToken !== undefined) {
        await ctx.startSoundcloud()
      }

      if (input.downloaderConcurrency !== undefined) {
        ctx.dl.setConcurrency(input.downloaderConcurrency)
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
  startLastFm: publicProcedure.mutation(async ({ ctx }) => {
    const status = await ctx.startLastFm()
    return formatLastFmStatus(status)
  }),
  stopLastFm: publicProcedure.mutation(({ ctx }) => {
    const status = ctx.stopLastFm()
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
  startSoundcloud: publicProcedure.mutation(async ({ ctx }) => {
    const status = await ctx.startSoundcloud()
    return formatSoundcloudStatus(status)
  }),
  stopSoundcloud: publicProcedure.mutation(({ ctx }) => {
    const status = ctx.stopSoundcloud()
    return formatSoundcloudStatus(status)
  }),
})

const formatStatus = (context: Context) => ({
  lastFm: formatLastFmStatus(context.lfm),
  soulseek: formatSlskStatus(context.slsk),
  soundcloud: formatSoundcloudStatus(context.sc),
  spotify: formatSpotifyStatus(context.sp),
})

const formatLastFmStatus = (status: ContextLastFm) =>
  status.status === 'stopped'
    ? ({ status: 'stopped', error: undefined } as const)
    : status.status === 'errored'
    ? ({ status: 'errored', error: toErrorString(status.error) } as const)
    : status.status === 'authenticating'
    ? ({ status: 'authenticating', error: undefined } as const)
    : status.status === 'authenticated'
    ? ({ status: 'authenticated', error: undefined } as const)
    : status.status === 'logging-in'
    ? ({ status: 'logging-in', error: undefined } as const)
    : status.status === 'degraded'
    ? ({ status: 'degraded', error: toErrorString(status.error) } as const)
    : ({ status: 'logged-in', error: undefined } as const)

const formatSlskStatus = (status: ContextSlsk) =>
  status.status === 'stopped'
    ? ({ status: 'stopped' } as const)
    : status.status === 'errored'
    ? ({ status: 'errored', error: toErrorString(status.error) } as const)
    : status.status === 'logging-in'
    ? ({ status: 'logging-in' } as const)
    : ({ status: 'logged-in' } as const)

const formatSoundcloudStatus = (status: ContextSoundcloud) =>
  status.status === 'stopped'
    ? ({ status: 'stopped' } as const)
    : status.status === 'starting'
    ? ({ status: 'starting' } as const)
    : status.status === 'errored'
    ? ({ status: 'errored', error: toErrorString(status.error) } as const)
    : ({ status: 'running' } as const)

const formatSpotifyStatus = (status: ContextSpotify) =>
  status.status === 'stopped'
    ? ({
        status: 'stopped',
        features: status.features,
        errors: formatSpotifyErrors(status.errors),
      } as const)
    : status.status === 'starting'
    ? ({
        status: 'starting',
        features: status.features,
        errors: formatSpotifyErrors(status.errors),
      } as const)
    : status.status === 'errored'
    ? ({
        status: 'errored',
        features: status.features,
        errors: formatSpotifyErrors(status.errors),
      } as const)
    : status.status === 'degraded'
    ? ({
        status: 'degraded',
        features: status.features,
        errors: formatSpotifyErrors(status.errors),
      } as const)
    : ({
        status: 'running',
        features: status.features,
        errors: formatSpotifyErrors(status.errors),
      } as const)

const formatSpotifyErrors = (errors: ContextSpotifyErrors) => ({
  downloads: ifDefined(errors.downloads, toErrorString),
  friendActivity: ifDefined(errors.friendActivity, toErrorString),
  webApi: ifDefined(errors.webApi, toErrorString),
})
