import { z } from 'zod'

import { getAllDownloads, insertDownload, updateDownloadStatus } from '../db/operations/downloads'
import { downloadTrack } from '../services/soundcloud'
import { publicProcedure, router } from '../trpc'

export const downloadsRouter = router({
  download: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input: { id } }) => {
      const download = insertDownload({ ref: id, complete: false })
      const result = await downloadTrack(id)
      updateDownloadStatus(download.id, true)
      return result
    }),
  getAll: publicProcedure.query(() => getAllDownloads()),
})

export type AppRouter = typeof downloadsRouter
