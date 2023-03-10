import { z } from 'zod'

import { getAllDownloads, insertDownload, updateDownload } from '../db/operations/downloads'
import { downloadTrack } from '../services/soundcloud'
import { publicProcedure, router } from '../trpc'

export const downloadsRouter = router({
  download: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input: { id } }) => {
      let download = insertDownload({ ref: id, complete: false })
      const filePath = await downloadTrack(id)
      download = updateDownload(download.id, { complete: true, path: filePath })
      return download
    }),
  getAll: publicProcedure.query(() => getAllDownloads()),
})
