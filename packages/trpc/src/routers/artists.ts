import { publicProcedure, router } from '../trpc'

export const artistsRouter = router({
  getAll: publicProcedure.query(({ ctx }) => ctx.db.artists.getAll()),
})
