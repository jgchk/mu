import type { Context } from 'trpc'

import { env } from '../env'
import { makeDb } from './db'
import { makeDownloader } from './dl'
import { makeLastFm } from './lfm'
import { makeSoundcloud } from './sc'
import { makeSlsk } from './slsk'
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

      context.slsk = await makeSlsk()
    },
    stopSoulseek: () => {
      if (!context.slsk) return

      context.slsk.destroy()
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
