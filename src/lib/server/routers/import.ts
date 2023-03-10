import fs from 'fs/promises'
import path from 'path'
import untildify from 'untildify'
import { z } from 'zod'

import { walkDir } from '$lib/utils/fs'

import { getArtistsByName, insertArtist } from '../db/operations/artists'
import { deleteDownloadById, getDownloadById } from '../db/operations/downloads'
import {
  getTrackWithArtistsByPath,
  insertTrackWithArtists,
  updateTrackWithArtists,
} from '../db/operations/tracks'
import { env } from '../env'
import { publicProcedure, router } from '../trpc'
import { parseFile } from '../utils/music-metadata'

export const importRouter = router({
  file: publicProcedure
    .input(z.object({ filePath: z.string() }))
    .mutation(async ({ input: { filePath } }) => importFile(filePath)),
  dir: publicProcedure
    .input(z.object({ dirPath: z.string() }))
    .mutation(async ({ input: { dirPath } }) => {
      const filePaths = []
      for await (const filePath of walkDir(dirPath)) {
        filePaths.push(filePath)
      }
      return Promise.all(filePaths.map(importFile))
    }),
  download: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input: { id } }) => {
      const download = getDownloadById(id)

      if (!download.complete) {
        throw new Error('Download is not complete')
      }
      if (!download.path) {
        throw new Error('Download has no path')
      }

      const track = importFile(download.path)

      deleteDownloadById(download.id)

      return track
    }),
})

const importFile = async (filePath: string) => {
  const metadata = await parseFile(filePath)

  // returns undefined if no metadata available
  if (!metadata) {
    throw new Error('No metadata available')
  }

  // convert artist names to artist ids
  // - if artist with name exists, use that
  // - if not, create new artist
  const artists = metadata.artists.map((name) => {
    const matchingArtists = getArtistsByName(name)
    if (matchingArtists.length > 0) {
      return matchingArtists[0]
    } else {
      return insertArtist({ name })
    }
  })

  const musicDir = untildify(env.MUSIC_DIR)
  const newPath = path.join(musicDir, path.basename(filePath))

  const existingTrack = getTrackWithArtistsByPath(newPath)
  const track = existingTrack
    ? updateTrackWithArtists(existingTrack.id, {
        ...metadata,
        artists: artists.map((artist) => artist.id),
        path: newPath,
      })
    : insertTrackWithArtists({
        ...metadata,
        artists: artists.map((artist) => artist.id),
        path: newPath,
      })

  if (filePath !== newPath) {
    await fs.rename(filePath, newPath)
  }

  return track
}
