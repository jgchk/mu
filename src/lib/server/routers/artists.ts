import { getAllArtists } from '../db/operations/artists'
import { publicProcedure, router } from '../trpc'

export const artistsRouter = router({
  getAll: publicProcedure.query(() => getAllArtists()),
})
