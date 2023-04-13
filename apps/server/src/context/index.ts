import { SlskClient } from 'soulseek-ts'
import type { Context } from 'trpc'

import { env } from '../env'
import { makeDb } from './db'
import { makeDownloader } from './dl'
import { makeLastFm } from './lfm'
import { makeSoundcloud } from './sc'
import { makeSpotify } from './sp'

export const makeContext = async (): Promise<Context> => {
  const context: Context = {
    db: makeDb(),
    dl: makeDownloader(() => context),
    sc: makeSoundcloud(),
    sp: makeSpotify(),
    slsk: undefined,
    lfm: await makeLastFm(),
    musicDir: env.MUSIC_DIR,
    startSoulseek: async () => {
      if (context.slsk) return

      context.slsk = new SlskClient()

      try {
        await context.slsk.login(env.SOULSEEK_USERNAME, env.SOULSEEK_PASSWORD)
      } catch (e) {
        context.slsk?.destroy()
        context.slsk = undefined
        throw e
      }

      context.slsk
        .on('listen-error', (error) => console.error('SLSK listen error', error))
        .on('server-error', (error) => console.error('SLSK server error', error))
        .on('client-error', (error) => console.error('SLSK client error', error))
    },
    stopSoulseek: () => {
      if (!context.slsk) return

      context.slsk?.destroy()
      context.slsk = undefined
    },
    restartSoulseek: async () => {
      if (context.slsk) {
        context.stopSoulseek()
      }

      return context.startSoulseek()
    },
    destroy: () => {
      context.db.close()
      context.dl.close()
      context.slsk?.destroy()
    },
  }

  return context
}
