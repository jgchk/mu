import type { Config } from 'db'
import { z } from 'zod'

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

    const lastFmStatus:
      | { available: false; error: Error }
      | { available: true; error?: Error; loggedIn: false }
      | { available: true; loggedIn: true } = ctx.lfm

    return {
      soulseek: soulseekStatus,
      lastFm: lastFmStatus,
    }
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
})
