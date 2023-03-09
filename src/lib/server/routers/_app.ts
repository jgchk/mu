import { fileExists, walkDir } from '$lib/utils/fs'
import untildify from 'untildify'
import {
  deleteTrackById,
  getAllTracks,
  getTrackByPath,
  insertTrack,
  updateTrack,
} from '../db/operations'
import { env } from '../env'
import { publicProcedure, router } from '../trpc'
import { isMetadataChanged, parseFile } from '../utils/music-metadata'
import { tracksRouter } from './tracks'

export const appRouter = router({
  ping: publicProcedure.query(() => 'pong!'),
  tracks: tracksRouter,
  sync: publicProcedure.mutation(async () => {
    const musicDir = untildify(env.MUSIC_DIR)

    const allExistingTracks = getAllTracks()
    await Promise.all(
      allExistingTracks.map(async (track) => {
        const exists = await fileExists(track.path)
        if (!exists) {
          deleteTrackById(track.id)
        }
      })
    )

    const tracks = []
    for await (const path of walkDir(musicDir)) {
      const metadata = await parseFile(path)

      // returns undefined if no metadata available
      if (!metadata) {
        continue
      }

      const existingTrack = getTrackByPath(path)
      if (existingTrack) {
        // check metadata for changes
        if (isMetadataChanged(existingTrack, metadata)) {
          // update the metadata in the db the file metdata has changed
          const updatedTrack = updateTrack(existingTrack.id, metadata)
          tracks.push(updatedTrack)
        } else {
          tracks.push(existingTrack)
        }
      } else {
        // add track to db
        tracks.push(insertTrack({ title: metadata.title, path }))
      }
    }

    return tracks
  }),
})

export type AppRouter = typeof appRouter
