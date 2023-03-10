import { getAllDownloads } from '../db/operations/downloads'
import { publicProcedure, router } from '../trpc'

export const downloadsRouter = router({
  getAll: publicProcedure.query(() => getAllDownloads()),
})

export type AppRouter = typeof downloadsRouter
