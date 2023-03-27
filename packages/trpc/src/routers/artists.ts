import { z } from 'zod'

import { publicProcedure, router } from '../trpc'

export const artistsRouter = router({
  add: publicProcedure
    .input(z.object({ name: z.string() }))
    .mutation(({ ctx, input }) => ctx.db.artists.insert({ name: input.name })),
  getAll: publicProcedure.query(({ ctx }) => ctx.db.artists.getAll()),
})
