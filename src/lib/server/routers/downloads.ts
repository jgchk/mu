import { z } from 'zod'

import { getAllReleaseDownloads, insertReleaseDownload } from '../db/operations/release-downloads'
import {
  getAllTrackDownloads,
  insertTrackDownload,
  updateTrackDownload,
} from '../db/operations/track-downloads'
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
        const downloadGroup = insertReleaseDownload({ name: playlist.title })
        return Promise.all(
          playlist.tracks.map((track) => handleDownloadTrack(track.id, downloadGroup.id))
        )
      }
    }),
  getAll: publicProcedure.query(async () => {
    const [tracks, releases] = await Promise.all([getAllTrackDownloads(), getAllReleaseDownloads()])
    return { tracks, releases }
  }),
})

const handleDownloadTrack = async (id: number, releaseDownloadId?: number) => {
  const track = await getTrack(id)
  let download = insertTrackDownload({
    ref: id,
    complete: false,
    name: track.title,
    releaseDownloadId,
  })
  const filePath = await downloadTrack(track)
  download = updateTrackDownload(download.id, { complete: true, path: filePath })
  return download
}
