import type { Config } from 'db'
import { ifDefined, toErrorString } from 'utils'
import { z } from 'zod'

import type { ContextLastFm } from '../context'
import { publicProcedure, router } from '../trpc'

export const systemRouter = router({
  status: publicProcedure.query(({ ctx }) => {
    let soulseekStatus: 'stopped' | 'starting' | 'running'
    if (ctx.slsk) {
      if (ctx.slsk.loggedIn) {
        soulseekStatus = 'running'
      } else {
        soulseekStatus = 'starting'
      }
    } else {
      soulseekStatus = 'stopped'
    }

    return {
      soulseek: soulseekStatus,
      lastFm: formatLastFmStatus(ctx.lfm),
    }
  }),
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
      })
    )
    .mutation(async ({ ctx, input }) => {
      const updated = ctx.db.configs.update(input)
      await ctx.updateLastFM()
      return updated
    }),
  startSoulseek: publicProcedure.mutation(async ({ ctx }) => {
    await ctx.startSoulseek()
  }),
  stopSoulseek: publicProcedure.mutation(({ ctx }) => {
    ctx.stopSoulseek()
  }),
  restartSoulseek: publicProcedure.mutation(async ({ ctx }) => {
    await ctx.restartSoulseek()
  }),
  reloadLastFm: publicProcedure.mutation(async ({ ctx }) => {
    const status = await ctx.updateLastFM()
    return formatLastFmStatus(status)
  }),
})

const formatLastFmStatus = (status: ContextLastFm) =>
  status.available
    ? status.loggedIn
      ? ({ available: true, loggedIn: true } as const)
      : ({
          available: true,
          loggedIn: false,
          error: ifDefined(status.error, toErrorString),
        } as const)
    : ({ available: false, error: toErrorString(status.error) } as const)
