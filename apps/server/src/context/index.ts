import { SlskClient } from 'soulseek-ts'
import type { Context } from 'trpc'
import type { ContextLastFm } from 'trpc/src/context'

import { env } from '../env'
import { makeDb } from './db'
import { makeDownloader } from './dl'
import { makeLastFm } from './lfm'
import { makeSoundcloud } from './sc'
import { makeSpotify } from './sp'

export const makeContext = async (): Promise<Context> => {
  const db = makeDb()

  const getLfm = async (): Promise<ContextLastFm> => {
    const config = db.configs.get()
    if (config.lastFmKey) {
      return makeLastFm({
        apiKey: config.lastFmKey,
        username: config.lastFmUsername,
        password: config.lastFmPassword,
        apiSecret: config.lastFmSecret,
      })
    } else {
      return { available: false, error: new Error('API key is not configured') }
    }
  }

  const context: Context = {
    db,
    dl: makeDownloader(() => context),
    sc: makeSoundcloud(),
    sp: makeSpotify(),
    slsk: undefined,
    lfm: await getLfm(),
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
    updateLastFM: async () => {
      context.lfm = await getLfm()
    },
    destroy: () => {
      context.db.close()
      context.dl.close()
      context.slsk?.destroy()
    },
  }

  return context
}
