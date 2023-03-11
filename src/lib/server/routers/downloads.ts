import { z } from 'zod'

import { getAllDownloads, insertDownload, updateDownload } from '../db/operations/downloads'
import { downloadTrack, getPlaylist, getTrack } from '../services/soundcloud'
import { publicProcedure, router } from '../trpc'

export const downloadsRouter = router({
  download: publicProcedure
    .input(z.object({ id: z.number(), kind: z.union([z.literal('track'), z.literal('playlist')]) }))
    .mutation(async ({ input: { id, kind } }) => {
      if (kind === 'track') {
        return handleDownloadTrack(id)
      } else {
        // ???: How to handle playlist downloads?
        // - Ideally I want an entry on the download page for the playlist, which is expandable to see the download status of each individual track
        // - Do I need db table for playlist downloads? Or can I just set a column on the track downloads table to indicate that it's part of a playlist download?
        //    - I think it depends on whether I want to put additional info about the playlist in the db

        const playlist = await getPlaylist(id)
        return Promise.all(playlist.tracks.map((track) => handleDownloadTrack(track.id)))
      }
    }),
  getAll: publicProcedure.query(() => getAllDownloads()),
})

const handleDownloadTrack = async (id: number) => {
  const track = await getTrack(id)
  let download = insertDownload({ ref: id, complete: false, name: track.title })
  const filePath = await downloadTrack(track)
  download = updateDownload(download.id, { complete: true, path: filePath })
  return download
}
