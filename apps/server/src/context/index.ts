import type { Database } from 'db'
import { ImageManager } from 'image-manager'
import { SlskClient } from 'soulseek-ts'
import { Soundcloud } from 'soundcloud'
import type { SpotifyOptions } from 'spotify'
import { Spotify } from 'spotify'
import type { Context, ContextSpotifyErrors } from 'trpc'
import type { ContextSpotify, ContextSpotifyFeatures } from 'trpc/src/context'
import { keys, withProps } from 'utils'

import { env } from '../env'
import { makeDb } from './db'
import { makeDownloader } from './dl'
import { makeLastFm } from './lfm'

const spotifyNoFeatures: ContextSpotifyFeatures = {
  downloads: false,
  friendActivity: false,
  webApi: false,
}
const spotifyNoErrors: ContextSpotifyErrors = {}
const spotifyStopped: ContextSpotify = {
  status: 'stopped',
  features: spotifyNoFeatures,
  errors: spotifyNoErrors,
}

const setConfigFromEnv = (db: Database) => {
  const config = db.config.get()
  db.config.update({
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
  })
}

export const makeContext = async (): Promise<Context> => {
  const db = makeDb()

  setConfigFromEnv(db)

  const updateLfm = async () => {
    context.lfm = { status: 'stopped' }

    const config = db.config.get()

    if (config.lastFmKey) {
      const lfm = await makeLastFm(
        {
          apiKey: config.lastFmKey,
          username: config.lastFmUsername,
          password: config.lastFmPassword,
          apiSecret: config.lastFmSecret,
        },
        {
          onAuthenticating: (lfm) => {
            context.lfm = withProps(lfm, { status: 'authenticating' } as const)
          },
          onLoggingIn: (lfm) => {
            context.lfm = withProps(lfm, { status: 'logging-in' } as const)
          },
        }
      )
      context.lfm = lfm
    }
  }

  const updateSoundcloud = async () => {
    context.sc = { status: 'stopped' }

    const config = db.config.get()

    if (config.soundcloudAuthToken) {
      context.sc = { status: 'starting' }
      const sc = new Soundcloud(config.soundcloudAuthToken)
      try {
        await sc.checkAuthToken()
        context.sc = withProps(sc, { status: 'running' } as const)
      } catch (e) {
        context.sc = { status: 'errored', error: e }
      }
    }
  }

  const updateSpotify = async () => {
    context.sp = spotifyStopped

    const config = db.config.get()

    const opts: SpotifyOptions = {}

    if (config.spotifyUsername && config.spotifyPassword) {
      opts.downloads = {
        username: config.spotifyUsername,
        password: config.spotifyPassword,
        devMode: env.NODE_ENV === 'development',
      }
    }

    if (config.spotifyDcCookie) {
      opts.friendActivity = {
        dcCookie: config.spotifyDcCookie,
      }
    }

    if (config.spotifyClientId && config.spotifyClientSecret) {
      opts.webApi = {
        clientId: config.spotifyClientId,
        clientSecret: config.spotifyClientSecret,
      }
    }

    const enabledFeatures = keys(opts)

    if (enabledFeatures.length === 0) {
      context.sp = spotifyStopped
      return
    }

    const spotify = Spotify(opts)

    context.sp = {
      status: 'starting',
      features: spotifyNoFeatures,
      errors: spotifyNoErrors,
    }

    const errors: ContextSpotifyErrors = {}
    await Promise.all([
      (async () => {
        if (spotify.downloads) {
          try {
            await spotify.checkCredentials()
          } catch (e) {
            errors.downloads = e
          }
        }
      })(),
      (async () => {
        if (spotify.friendActivity) {
          try {
            await spotify.getFriendActivity()
          } catch (e) {
            errors.friendActivity = e
          }
        }
      })(),
      (async () => {
        if (spotify.webApi) {
          try {
            await spotify.getAccessToken()
          } catch (e) {
            errors.webApi = e
          }
        }
      })(),
    ])

    const numFailed = Object.keys(errors).length
    const allFailed = numFailed === enabledFeatures.length
    const someFailed = numFailed > 0
    if (allFailed) {
      context.sp = {
        status: 'errored',
        errors,
        features: spotifyNoFeatures,
      }
    } else if (someFailed) {
      context.sp = withProps(spotify, {
        status: 'degraded',
        errors,
        features: {
          downloads: !errors.downloads && !!spotify.downloads,
          friendActivity: !errors.friendActivity && !!spotify.friendActivity,
          webApi: !errors.webApi && !!spotify.webApi,
        },
      } as const)
    } else {
      context.sp = withProps(spotify, {
        status: 'running',
        features: {
          downloads: !!spotify.downloads,
          friendActivity: !!spotify.friendActivity,
          webApi: !!spotify.webApi,
        },
        errors: spotifyNoErrors,
      } as const)
    }
  }

  const context: Context = {
    db,
    dl: makeDownloader(() => context),
    sc: { status: 'stopped' },
    sp: spotifyStopped,
    slsk: { status: 'stopped' },
    lfm: { status: 'stopped' },
    img: new ImageManager({ imagesDir: env.IMAGES_DIR, db }),
    musicDir: env.MUSIC_DIR,
    imagesDir: env.IMAGES_DIR,
    startSoulseek: async () => {
      context.stopSoulseek()

      const { soulseekUsername: username, soulseekPassword: password } = db.config.get()

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
        let error = e
        if (e instanceof Error && e.message.includes('INVALIDPASS')) {
          error = new Error('Invalid password')
        }
        context.slsk = { status: 'errored', error }
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
    startLastFm: async () => {
      await updateLfm()
      return context.lfm
    },
    stopLastFm: () => {
      context.lfm = { status: 'stopped' }
      return context.lfm
    },
    startSpotify: async () => {
      await updateSpotify()
      return context.sp
    },
    stopSpotify: () => {
      context.sp = spotifyStopped
      return context.sp
    },
    startSoundcloud: async () => {
      await updateSoundcloud()
      return context.sc
    },
    stopSoundcloud: () => {
      context.sc = { status: 'stopped' }
      return context.sc
    },
    destroy: () => {
      context.db.close()
      context.dl.close()
      if (context.slsk.status === 'logging-in' || context.slsk.status === 'logged-in') {
        context.slsk.destroy()
      }
    },
  }

  await Promise.all([
    updateSpotify(),
    updateLfm(),
    updateSoundcloud(),
    ...(env.NODE_ENV === 'production' ? [context.startSoulseek()] : []),
  ])

  return context
}
