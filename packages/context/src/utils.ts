import { Database } from 'db'
import { env } from 'env'
import { LastFM } from 'last-fm'
import { withProps } from 'utils'

import type { ContextLastFm } from './types'

export const setConfigFromEnv = (db: Database) => {
  const config = db.config.get()
  return db.config.update({
    soundcloudAuthToken: config.soundcloudAuthToken ?? env.SOUNDCLOUD_AUTH_TOKEN,
    spotifyClientId: config.spotifyClientId ?? env.SPOTIFY_CLIENT_ID,
    spotifyClientSecret: config.spotifyClientSecret ?? env.SPOTIFY_CLIENT_SECRET,
    spotifyUsername: config.spotifyUsername ?? env.SPOTIFY_USERNAME,
    spotifyPassword: config.spotifyPassword ?? env.SPOTIFY_PASSWORD,
    spotifyDcCookie: config.spotifyDcCookie ?? env.SPOTIFY_DC_COOKIE,
    soulseekUsername: config.soulseekUsername ?? env.SOULSEEK_USERNAME,
    soulseekPassword: config.soulseekPassword ?? env.SOULSEEK_PASSWORD,
    lastFmKey: config.lastFmKey ?? env.LASTFM_KEY,
    lastFmSecret: config.lastFmSecret ?? env.LASTFM_SECRET,
    lastFmUsername: config.lastFmUsername ?? env.LASTFM_USERNAME,
    lastFmPassword: config.lastFmPassword ?? env.LASTFM_PASSWORD,
    downloaderConcurrency: config.downloaderConcurrency ?? env.DOWNLOADER_CONCURRENCY,
  })
}

export const makeDb = () => Database(env.DATABASE_URL)

export const makeLastFm = async (
  opts: {
    apiKey: string
    username?: string | null
    password?: string | null
    apiSecret?: string | null
  },
  cb?: {
    onAuthenticating?: (lfm: LastFM) => void
    onLoggingIn?: (lfm: LastFM) => void
  }
): Promise<ContextLastFm> => {
  const lfm = new LastFM({ apiKey: opts.apiKey })

  try {
    cb?.onAuthenticating?.(lfm)
    await lfm.getTrackInfo({ artist: 'test', track: 'test' })
  } catch (e) {
    return { status: 'errored', error: new Error('API key is invalid') }
  }

  if (opts.username && opts.password && opts.apiSecret) {
    try {
      cb?.onLoggingIn?.(lfm)
      const lfmAuthed = await lfm.login({
        username: opts.username,
        password: opts.password,
        apiSecret: opts.apiSecret,
      })
      return withProps(lfmAuthed, { status: 'logged-in' } as const)
    } catch (e) {
      return withProps(lfm, { status: 'degraded', error: e } as const)
    }
  } else {
    return withProps(lfm, { status: 'authenticated' } as const)
  }
}
