import { Downloader } from 'downloader'
import { env } from 'env'
import { ImageManager } from 'image-manager'
import { log } from 'log'
import { SlskClient } from 'soulseek-ts'
import { Soundcloud } from 'soundcloud'
import type { SpotifyOptions } from 'spotify'
import { Spotify } from 'spotify'
import { keys, withProps } from 'utils'

import type {
  Context,
  ContextLastFm,
  ContextSlsk,
  ContextSoundcloud,
  ContextSpotify,
  ContextSpotifyErrors,
  ContextSpotifyFeatures,
} from './types'
import { makeDb, makeLastFm, setConfigFromEnv } from './utils'

export const makeContext = async (): Promise<Context> => {
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

  const db = makeDb()
  const config = setConfigFromEnv(db)

  let lastFm: ContextLastFm = { status: 'stopped' }
  let soulseek: ContextSlsk = { status: 'stopped' }
  let soundcloud: ContextSoundcloud = { status: 'stopped' }
  let spotify: ContextSpotify = spotifyStopped
  const downloader = new Downloader({
    getContext: () => ({ db, lfm: lastFm, slsk: soulseek, sc: soundcloud, sp: spotify }),
    downloadDir: env.DOWNLOAD_DIR,
    logger: log,
    concurrency: config.downloaderConcurrency,
  })
  const imageManager = new ImageManager({ imagesDir: env.IMAGES_DIR, db })

  const startLastFm = async () => {
    lastFm = { status: 'stopped' }

    const config = db.config.get()

    if (config.lastFmKey) {
      lastFm = await makeLastFm(
        {
          apiKey: config.lastFmKey,
          username: config.lastFmUsername,
          password: config.lastFmPassword,
          apiSecret: config.lastFmSecret,
        },
        {
          onAuthenticating: (lfm) => {
            lastFm = withProps(lfm, { status: 'authenticating' } as const)
          },
          onLoggingIn: (lfm) => {
            lastFm = withProps(lfm, { status: 'logging-in' } as const)
          },
        }
      )
    }

    return lastFm
  }
  const stopLastFm = () => {
    lastFm = { status: 'stopped' }
    return lastFm
  }

  const startSoulseek = async () => {
    log.debug('startSoulseek: Stopping soulseek')
    stopSoulseek()

    log.debug('startSoulseek: Getting config')
    const { soulseekUsername: username, soulseekPassword: password } = db.config.get()

    if (!username) {
      if (!password) {
        log.debug('startSoulseek: Username & password are not configured')
        soulseek = {
          status: 'errored',
          error: new Error('Soulseek username & password are not configured'),
        }
        return soulseek
      } else {
        log.debug('startSoulseek: Username is not configured')
        soulseek = {
          status: 'errored',
          error: new Error('Soulseek username is not configured'),
        }
        return soulseek
      }
    } else {
      if (!password) {
        log.debug('startSoulseek: Password is not configured')
        soulseek = {
          status: 'errored',
          error: new Error('Soulseek password is not configured'),
        }
        return soulseek
      }
    }

    log.debug('startSoulseek: Creating client')
    const slsk = new SlskClient()
    log.debug('startSoulseek: Constructed client')
    soulseek = withProps(slsk, { status: 'logging-in' } as const)

    try {
      log.debug('startSoulseek: Logging in')
      await slsk.login(username, password)
      log.debug('startSoulseek: Logged in')
    } catch (e) {
      log.debug('startSoulseek: Failed to log in')
      slsk.destroy()
      log.debug('startSoulseek: Destroyed client')
      let error = e
      if (e instanceof Error && e.message.includes('INVALIDPASS')) {
        log.debug('startSoulseek: Invalid password')
        error = new Error('Invalid password')
      }
      log.debug('startSoulseek: Setting error')
      soulseek = { status: 'errored', error }
      return soulseek
    }

    log.debug('startSoulseek: Setting status')
    soulseek = withProps(slsk, { status: 'logged-in' } as const)
    log.debug('startSoulseek: Setting listeners')
    slsk
      .on('listen-error', (error) => log.error(error, 'SLSK listen error'))
      .on('server-error', (error) => log.error(error, 'SLSK server error'))
      .on('client-error', (error) => log.error(error, 'SLSK client error'))
    log.debug('startSoulseek: Done')
    return soulseek
  }
  const stopSoulseek = () => {
    if (soulseek.status === 'logging-in' || soulseek.status === 'logged-in') {
      soulseek.destroy()
    }
    soulseek = { status: 'stopped' }
    return soulseek
  }

  const startSoundcloud = async () => {
    soundcloud = { status: 'stopped' }

    const config = db.config.get()

    if (config.soundcloudAuthToken) {
      soundcloud = { status: 'starting' }
      const sc = new Soundcloud(config.soundcloudAuthToken)
      try {
        await sc.checkAuthToken()
        soundcloud = withProps(sc, { status: 'running' } as const)
      } catch (e) {
        soundcloud = { status: 'errored', error: e }
      }
    }

    return soundcloud
  }
  const stopSoundcloud = () => {
    soundcloud = { status: 'stopped' }
    return soundcloud
  }

  const startSpotify = async () => {
    spotify = spotifyStopped
    log.debug('startSpotify: Stopped Spotify')

    const config = db.config.get()

    const opts: SpotifyOptions = {}

    if (config.spotifyUsername && config.spotifyPassword) {
      log.debug('startSpotify: Downloads are configured')
      opts.downloads = {
        username: config.spotifyUsername,
        password: config.spotifyPassword,
        devMode: env.NODE_ENV === 'development',
      }
    }

    if (config.spotifyDcCookie) {
      log.debug('startSpotify: Friend Activity is configured')
      opts.friendActivity = {
        dcCookie: config.spotifyDcCookie,
      }
    }

    if (config.spotifyClientId && config.spotifyClientSecret) {
      log.debug('startSpotify: Web API is configured')
      opts.webApi = {
        clientId: config.spotifyClientId,
        clientSecret: config.spotifyClientSecret,
      }
    }

    const enabledFeatures = keys(opts)

    if (enabledFeatures.length === 0) {
      log.debug('startSpotify: No features are enabled')
      spotify = spotifyStopped
      return spotify
    }

    log.debug('startSpotify: Creating client')
    const sp = Spotify(opts)

    spotify = {
      status: 'starting',
      features: spotifyNoFeatures,
      errors: spotifyNoErrors,
    }

    log.debug('startSpotify: Starting...')
    const errors: ContextSpotifyErrors = {}
    await Promise.all([
      (async () => {
        if (sp.downloads) {
          try {
            await sp.checkCredentials()
            log.debug('startSpotify: Started Downloads')
          } catch (e) {
            log.debug(e, 'startSpotify: Failed to start Downloads')
            errors.downloads = e
          }
        }
      })(),
      (async () => {
        if (sp.friendActivity) {
          try {
            await sp.getFriendActivity()
            log.debug('startSpotify: Started Friend Activity')
          } catch (e) {
            log.debug(e, 'startSpotify: Failed to start Friend Activity')
            errors.friendActivity = e
          }
        }
      })(),
      (async () => {
        if (sp.webApi) {
          try {
            await sp.getAccessToken()
            log.debug('startSpotify: Started Web API')
          } catch (e) {
            log.debug(e, 'startSpotify: Failed to start Web API')
            errors.webApi = e
          }
        }
      })(),
    ])

    const numFailed = Object.keys(errors).length
    const allFailed = numFailed === enabledFeatures.length
    const someFailed = numFailed > 0
    if (allFailed) {
      log.debug('startSpotify: All features failed')
      spotify = {
        status: 'errored',
        errors,
        features: spotifyNoFeatures,
      }
    } else if (someFailed) {
      log.debug('startSpotify: Some features failed')
      spotify = withProps(sp, {
        status: 'degraded',
        errors,
        features: {
          downloads: !errors.downloads && !!sp.downloads,
          friendActivity: !errors.friendActivity && !!sp.friendActivity,
          webApi: !errors.webApi && !!sp.webApi,
        },
      } as const)
    } else {
      log.debug('startSpotify: All features started')
      spotify = withProps(sp, {
        status: 'running',
        features: {
          downloads: !!sp.downloads,
          friendActivity: !!sp.friendActivity,
          webApi: !!sp.webApi,
        },
        errors: spotifyNoErrors,
      } as const)
    }

    return spotify
  }
  const stopSpotify = () => {
    spotify = spotifyStopped
    return spotify
  }

  await Promise.all([
    startLastFm(),
    ...(env.NODE_ENV === 'production' ? [startSoulseek()] : []),
    startSoundcloud(),
    startSpotify(),
  ])

  return {
    db,
    dl: downloader,
    img: imageManager,

    lfm: lastFm,
    sc: soundcloud,
    slsk: soulseek,
    sp: spotify,

    startLastFm,
    stopLastFm,

    startSoundcloud,
    stopSoundcloud,

    startSoulseek,
    stopSoulseek,

    startSpotify,
    stopSpotify,

    destroy: () => {
      db.close()
      downloader.close()
      if (soulseek.status === 'logging-in' || soulseek.status === 'logged-in') {
        soulseek.destroy()
      }
    },
  }
}
