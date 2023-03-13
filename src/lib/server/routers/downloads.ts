import { z } from 'zod'

import { getAllReleaseDownloads, insertReleaseDownload } from '../db/operations/release-downloads'
import {
  getAllTrackDownloads,
  insertTrackDownload,
  updateTrackDownload,
} from '../db/operations/track-downloads'
import { downloadTrack, getPlaylist, getTrack } from '../services/soundcloud'
import { publicProcedure, router } from '../trpc'
import { parseArtistTitle, writeFile } from '../utils/music-metadata'

export const downloadsRouter = router({
  download: publicProcedure
    .input(z.object({ id: z.number(), kind: z.union([z.literal('track'), z.literal('playlist')]) }))
    .mutation(async ({ input: { id, kind } }) => {
      if (kind === 'track') {
        const scTrack = await getTrack(id)

        let dbDownload = insertTrackDownload({
          ref: id,
          complete: false,
          name: scTrack.title,
        })

        const filePath = await downloadTrack(scTrack)

        const { artists, title } = parseArtistTitle(scTrack.title)
        await writeFile(filePath, {
          title,
          artists: artists ?? [scTrack.user.username],
          album: title,
          albumArtists: artists ?? [scTrack.user.username],
          trackNumber: '1',
        })

        dbDownload = updateTrackDownload(dbDownload.id, { complete: true, path: filePath })

        return dbDownload
      } else {
        const scPlaylist = await getPlaylist(id)

        const releaseDownload = insertReleaseDownload({ name: scPlaylist.title })

        const playlistArtistTitle = parseArtistTitle(scPlaylist.title)
        const releaseArtists = playlistArtistTitle.artists ?? [scPlaylist.user.username]
        const releaseTitle = playlistArtistTitle.title

        return Promise.all(
          scPlaylist.tracks.map(async (track, i) => {
            const scTrack = 'title' in track ? track : await getTrack(track.id)

            let dbDownload = insertTrackDownload({
              ref: id,
              complete: false,
              name: scTrack.title,
              releaseDownloadId: releaseDownload.id,
            })

            const filePath = await downloadTrack(scTrack)

            const { artists, title } = parseArtistTitle(scTrack.title)
            await writeFile(filePath, {
              title,
              artists: artists ?? [scTrack.user.username],
              album: releaseTitle,
              albumArtists: releaseArtists,
              trackNumber: (i + 1).toString(),
            })

            dbDownload = updateTrackDownload(dbDownload.id, { complete: true, path: filePath })

            return dbDownload
          })
        )
      }
    }),
  getAll: publicProcedure.query(async () => {
    const [tracks, releases] = await Promise.all([getAllTrackDownloads(), getAllReleaseDownloads()])
    return { tracks, releases }
  }),
})
