import type { Config } from 'db'
import { toErrorString } from 'utils'
import { z } from 'zod'

import type { ContextLastFm, ContextSlsk } from '../context'
import { publicProcedure, router } from '../trpc'

export const systemRouter = router({
  status: publicProcedure.query(({ ctx }) => ({
    soulseek: formatSlskStatus(ctx.slsk),
    lastFm: formatLastFmStatus(ctx.lfm),
  })),
  config: publicProcedure.query(({ ctx }) => {
    const config: Omit<Config, 'id'> = ctx.db.configs.get() ?? {
      lastFmKey: null,
      lastFmSecret: null,
      lastFmUsername: null,
      lastFmPassword: null,
    }
    return config
  }),
  updateConfig: publicProcedure
    .input(
      z.object({
        lastFmKey: z.string().nullish(),
        lastFmSecret: z.string().nullish(),
        lastFmUsername: z.string().nullish(),
        lastFmPassword: z.string().nullish(),
        soulseekUsername: z.string().nullish(),
        soulseekPassword: z.string().nullish(),
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

      return updated
    }),
  startSoulseek: publicProcedure.mutation(async ({ ctx }) => {
    await ctx.startSoulseek()
  }),
  stopSoulseek: publicProcedure.mutation(({ ctx }) => {
    ctx.stopSoulseek()
  }),
  reloadLastFm: publicProcedure.mutation(async ({ ctx }) => {
    const status = await ctx.updateLastFM()
    return formatLastFmStatus(status)
  }),
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
