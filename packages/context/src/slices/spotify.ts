import { env } from 'env'
import { log } from 'log'
import type { SpotifyOptions } from 'spotify'
import { Spotify } from 'spotify'
import { keys, withProps } from 'utils'

import type { Getter, Setter } from '../context'
import type {
  Context,
  ContextSpotify,
  ContextSpotifyErrors,
  ContextSpotifyFeatures,
} from '../types'

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

export const makeSpotifyContext = (
  set: Setter,
  get: Getter
): Pick<Context, 'sp' | 'startSpotify' | 'stopSpotify'> => ({
  sp: spotifyStopped,

  startSpotify: async () => {
    set({ sp: spotifyStopped })
    log.debug('startSpotify: Stopped Spotify')

    const config = get().db.config.get()

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
      set({ sp: spotifyStopped })
      return get().sp
    }

    log.debug('startSpotify: Creating client')
    const sp = Spotify(opts)

    set({
      sp: {
        status: 'starting',
        features: spotifyNoFeatures,
        errors: spotifyNoErrors,
      },
    })

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
      set({
        sp: {
          status: 'errored',
          errors,
          features: spotifyNoFeatures,
        },
      })
    } else if (someFailed) {
      log.debug('startSpotify: Some features failed')
      set({
        sp: withProps(sp, {
          status: 'degraded',
          errors,
          features: {
            downloads: !errors.downloads && !!sp.downloads,
            friendActivity: !errors.friendActivity && !!sp.friendActivity,
            webApi: !errors.webApi && !!sp.webApi,
          },
        } as const),
      })
    } else {
      log.debug('startSpotify: All features started')
      set({
        sp: withProps(sp, {
          status: 'running',
          features: {
            downloads: !!sp.downloads,
            friendActivity: !!sp.friendActivity,
            webApi: !!sp.webApi,
          },
          errors: spotifyNoErrors,
        } as const),
      })
    }

    return get().sp
  },

  stopSpotify: () => {
    set({ sp: spotifyStopped })
    return get().sp
  },
})
