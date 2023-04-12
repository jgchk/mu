import { Database } from 'db'
import { Downloader } from 'downloader'
import { LastFM } from 'last-fm'
import { SlskClient } from 'soulseek-ts'
import { Soundcloud } from 'soundcloud'
import { Spotify } from 'spotify'
import type { Context } from 'trpc'

import { env } from './env'

const makeContext = async () => {
  const db = new Database(env.DATABASE_URL)
  const sc = new Soundcloud({
    clientId: env.SOUNDCLOUD_CLIENT_ID,
    authToken: env.SOUNDCLOUD_AUTH_TOKEN,
  })
  const sp = new Spotify({
    devMode: env.NODE_ENV === 'development',
    clientId: env.SPOTIFY_CLIENT_ID,
    clientSecret: env.SPOTIFY_CLIENT_SECRET,
    username: env.SPOTIFY_USERNAME,
    password: env.SPOTIFY_PASSWORD,
    dcCookie: env.SPOTIFY_DC_COOKIE,
  })
  const slsk = new SlskClient()
  await slsk.login(env.SOULSEEK_USERNAME, env.SOULSEEK_PASSWORD)
  slsk
    .on('listen-error', (error) => console.error('SLSK listen error', error))
    .on('server-error', (error) => console.error('SLSK server error', error))
  const dl = new Downloader({ db, sc, sp, slsk, downloadDir: env.DOWNLOAD_DIR })
  const lfm = await new LastFM({ apiKey: env.LASTFM_KEY }).login({
    username: env.LASTFM_USERNAME,
    password: env.LASTFM_PASSWORD,
    apiSecret: env.LASTFM_SECRET,
  })

  const context: Context & { destroy: () => void } = {
    db,
    dl,
    sc,
    sp,
    slsk,
    lfm,
    musicDir: env.MUSIC_DIR,
    destroy: () => {
      context.db.close()
      context.dl.close()
      context.slsk.destroy()
    },
  }

  return context
}

export const ctx = await makeContext()
