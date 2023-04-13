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
})
