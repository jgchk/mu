import { Database } from 'db'
import { env } from 'env'
import type { LastFMAuthenticated } from 'last-fm'
import { LastFM } from 'last-fm'
import type { SlskClient } from 'soulseek-ts'
import type { Soundcloud } from 'soundcloud'
import type { Spotify } from 'spotify'
import { ifDefined, toErrorString, withProps } from 'utils'

export const setConfigFromEnv = (db: Database) => {
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

export type ContextLastFm =
  | { status: 'stopped'; error?: undefined }
  | { status: 'errored'; error: unknown }
  | ({ status: 'authenticating'; error?: undefined } & LastFM)
  | ({ status: 'authenticated'; error?: undefined } & LastFM)
  | ({ status: 'logging-in'; error?: undefined } & LastFM)
  | ({ status: 'degraded'; error: unknown } & LastFM)
  | ({ status: 'logged-in'; error?: undefined } & LastFMAuthenticated)

export type ContextSlsk =
  | { status: 'stopped' }
  | { status: 'errored'; error: unknown }
  | ({ status: 'logging-in' } & SlskClient)
  | ({ status: 'logged-in' } & SlskClient)

export type ContextSpotify =
  | { status: 'stopped'; features: ContextSpotifyFeatures; errors: ContextSpotifyErrors }
  | { status: 'starting'; features: ContextSpotifyFeatures; errors: ContextSpotifyErrors }
  | { status: 'errored'; features: ContextSpotifyFeatures; errors: ContextSpotifyErrors }
  | ({
      status: 'degraded'
      features: ContextSpotifyFeatures
      errors: ContextSpotifyErrors
    } & Spotify)
  | ({
      status: 'running'
      features: ContextSpotifyFeatures
      errors: ContextSpotifyErrors
    } & Spotify)

export type ContextSpotifyFeatures = {
  downloads: boolean
  friendActivity: boolean
  webApi: boolean
}

export type ContextSpotifyErrors = {
  downloads?: unknown
  friendActivity?: unknown
  webApi?: unknown
}

export type ContextSoundcloud =
  | { status: 'stopped' }
  | { status: 'starting' }
  | { status: 'errored'; error: unknown }
  | ({ status: 'running' } & Soundcloud)

export type FormattedStatus = ReturnType<typeof formatStatus>
export const formatStatus = (services: {
  lastFm: ContextLastFm
  soulseek: ContextSlsk
  soundcloud: ContextSoundcloud
  spotify: ContextSpotify
}) => ({
  lastFm: formatLastFmStatus(services.lastFm),
  soulseek: formatSlskStatus(services.soulseek),
  soundcloud: formatSoundcloudStatus(services.soundcloud),
  spotify: formatSpotifyStatus(services.spotify),
})

export type FormattedLastFmStatus = ReturnType<typeof formatLastFmStatus>
export const formatLastFmStatus = (lastFm: ContextLastFm) =>
  lastFm.status === 'stopped'
    ? ({ status: 'stopped', error: undefined } as const)
    : lastFm.status === 'errored'
    ? ({ status: 'errored', error: toErrorString(lastFm.error) } as const)
    : lastFm.status === 'authenticating'
    ? ({ status: 'authenticating', error: undefined } as const)
    : lastFm.status === 'authenticated'
    ? ({ status: 'authenticated', error: undefined } as const)
    : lastFm.status === 'logging-in'
    ? ({ status: 'logging-in', error: undefined } as const)
    : lastFm.status === 'degraded'
    ? ({ status: 'degraded', error: toErrorString(lastFm.error) } as const)
    : ({ status: 'logged-in', error: undefined } as const)

export type FormattedSoulseekStatus = ReturnType<typeof formatSlskStatus>
export const formatSlskStatus = (soulseek: ContextSlsk) =>
  soulseek.status === 'stopped'
    ? ({ status: 'stopped' } as const)
    : soulseek.status === 'errored'
    ? ({ status: 'errored', error: toErrorString(soulseek.error) } as const)
    : soulseek.status === 'logging-in'
    ? ({ status: 'logging-in' } as const)
    : ({ status: 'logged-in' } as const)

export type FormattedSoundcloudStatus = ReturnType<typeof formatSoundcloudStatus>
export const formatSoundcloudStatus = (soundcloud: ContextSoundcloud) =>
  soundcloud.status === 'stopped'
    ? ({ status: 'stopped' } as const)
    : soundcloud.status === 'starting'
    ? ({ status: 'starting' } as const)
    : soundcloud.status === 'errored'
    ? ({ status: 'errored', error: toErrorString(soundcloud.error) } as const)
    : ({ status: 'running' } as const)

export type FormattedSpotifyStatus = ReturnType<typeof formatSpotifyStatus>
export const formatSpotifyStatus = (spotify: ContextSpotify) =>
  spotify.status === 'stopped'
    ? ({
        status: 'stopped',
        features: spotify.features,
        errors: formatSpotifyErrors(spotify.errors),
      } as const)
    : spotify.status === 'starting'
    ? ({
        status: 'starting',
        features: spotify.features,
        errors: formatSpotifyErrors(spotify.errors),
      } as const)
    : spotify.status === 'errored'
    ? ({
        status: 'errored',
        features: spotify.features,
        errors: formatSpotifyErrors(spotify.errors),
      } as const)
    : spotify.status === 'degraded'
    ? ({
        status: 'degraded',
        features: spotify.features,
        errors: formatSpotifyErrors(spotify.errors),
      } as const)
    : ({
        status: 'running',
        features: spotify.features,
        errors: formatSpotifyErrors(spotify.errors),
      } as const)

export const formatSpotifyErrors = (errors: ContextSpotifyErrors) => ({
  downloads: ifDefined(errors.downloads, toErrorString),
  friendActivity: ifDefined(errors.friendActivity, toErrorString),
  webApi: ifDefined(errors.webApi, toErrorString),
})
