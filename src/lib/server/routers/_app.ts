import { walkDir } from '$lib/utils/fs'
import { parseFile } from 'music-metadata'
import untildify from 'untildify'
import { env } from '../env'
import { publicProcedure, router } from '../trpc'

export const appRouter = router({
  ping: publicProcedure.query(() => 'pong!'),
  sync: publicProcedure.mutation(async () => {
    const musicDir = untildify(env.PUBLIC_MUSIC_DIR)

    type MusicFile = {
      path: string
      metadata: MusicMetadata
    }
    type MusicMetadata = {
      title: string | undefined
    }

    const musicFiles: MusicFile[] = []
    for await (const file of walkDir(musicDir)) {
      try {
        const metadata = await parseFile(file)
        musicFiles.push({
          path: file,
          metadata: {
            title: metadata.common.title,
          },
        })
      } catch (error) {
        if (error instanceof Error && error.message.startsWith('Guessed MIME-type not supported')) {
          // ignore
        } else {
          throw error
        }
      }
    }

    return musicFiles
  }),
})

export type AppRouter = typeof appRouter
