import { walkDir } from '$lib/utils/fs'
import { isDefined } from '$lib/utils/types'
import { parseFile } from 'music-metadata'
import untildify from 'untildify'
import { insertTrack } from '../db/operations'
import { env } from '../env'
import { publicProcedure, router } from '../trpc'

export const appRouter = router({
  ping: publicProcedure.query(() => 'pong!'),
  sync: publicProcedure.mutation(async () => {
    const musicDir = untildify(env.MUSIC_DIR)

    const files: string[] = []
    for await (const file of walkDir(musicDir)) {
      files.push(file)
    }

    const musicFiles = (
      await Promise.all(
        files.map(async (file) => {
          try {
            const metadata = await parseFile(file)
            return {
              path: file,
              metadata: {
                title: metadata.common.title,
              },
            }
          } catch (error) {
            if (
              error instanceof Error &&
              error.message.startsWith('Guessed MIME-type not supported')
            ) {
              // ignore
            } else {
              throw error
            }
          }
        })
      )
    ).filter(isDefined)

    const dbTracks = musicFiles.map((musicFile) =>
      insertTrack({ title: musicFile.metadata.title, path: musicFile.path })
    )

    return dbTracks
  }),
})

export type AppRouter = typeof appRouter
