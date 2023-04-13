import { publicProcedure, router } from '../trpc'

export const systemRouter = router({
  restartSoulseek: publicProcedure.mutation(async ({ ctx }) => {
    await ctx.restartSoulseek()
  }),
})
