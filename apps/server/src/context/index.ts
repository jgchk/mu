import { SlskClient } from 'soulseek-ts'
import type { Context } from 'trpc'
import type { ContextLastFm } from 'trpc/src/context'
import { withProps } from 'utils'

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
    slsk: { status: 'stopped' },
    lfm: await getLfm(),
    musicDir: env.MUSIC_DIR,
    startSoulseek: async () => {
      context.stopSoulseek()

      const { soulseekUsername: username, soulseekPassword: password } = db.configs.get()

      if (!username) {
        if (!password) {
          context.slsk = {
            status: 'errored',
            error: new Error('Soulseek username & password are not configured'),
          }
          return context.slsk
        } else {
          context.slsk = {
            status: 'errored',
            error: new Error('Soulseek username is not configured'),
          }
          return context.slsk
        }
      } else {
        if (!password) {
          context.slsk = {
            status: 'errored',
            error: new Error('Soulseek password is not configured'),
          }
          return context.slsk
        }
      }

      const slsk = new SlskClient()
      context.slsk = withProps(slsk, { status: 'logging-in' } as const)

      try {
        await slsk.login(username, password)
      } catch (e) {
        slsk.destroy()
        context.slsk = { status: 'errored', error: e }
        return context.slsk
      }

      context.slsk = withProps(slsk, { status: 'logged-in' } as const)
      context.slsk
        .on('listen-error', (error) => console.error('SLSK listen error', error))
        .on('server-error', (error) => console.error('SLSK server error', error))
        .on('client-error', (error) => console.error('SLSK client error', error))
      return context.slsk
    },
    stopSoulseek: () => {
      if (context.slsk.status === 'logging-in' || context.slsk.status === 'logged-in') {
        context.slsk.destroy()
      }
      context.slsk = { status: 'stopped' }
      return context.slsk
    },
    updateLastFM: async () => {
      context.lfm = await getLfm()
      return context.lfm
    },
    destroy: () => {
      context.db.close()
      context.dl.close()
      if (context.slsk.status === 'logging-in' || context.slsk.status === 'logged-in') {
        context.slsk.destroy()
      }
    },
  }

  return context
}
