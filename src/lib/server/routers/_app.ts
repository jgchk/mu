import { fileExists, walkDir } from '$lib/utils/fs'
import { parseFile } from 'music-metadata'
import untildify from 'untildify'
import { deleteTrackById, getAllTracks, getTrackByPath, insertTrack } from '../db/operations'
import { env } from '../env'
import { publicProcedure, router } from '../trpc'

export const appRouter = router({
  ping: publicProcedure.query(() => 'pong!'),
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
      try {
        // this will throw if the file is not a supported format
        const metadata = await parseFile(path)

        const track = getTrackByPath(path) ?? insertTrack({ title: metadata.common.title, path })
        tracks.push(track)
      } catch (error) {
        if (error instanceof Error && error.message.startsWith('Guessed MIME-type not supported')) {
          // ignore
        } else {
          throw error
        }
      }
    }

    return tracks
  }),
})

export type AppRouter = typeof appRouter
