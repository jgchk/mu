import type { Download } from 'downloader'
import { Downloader } from 'downloader'
import { env } from 'env'
import type { LastFMAuthenticated } from 'last-fm'
import { log } from 'log'
import { SlskClient } from 'soulseek-ts'
import { Soundcloud } from 'soundcloud'
import type { SpotifyOptions } from 'spotify'
import { Spotify } from 'spotify'
import type { FriendActivityEnabled } from 'spotify/src/features/friends'
import type { WebApiEnabled } from 'spotify/src/features/web-api'
import { keys, withProps } from 'utils'

import type {
  ContextLastFm,
  ContextSlsk,
  ContextSoundcloud,
  ContextSpotify,
  ContextSpotifyErrors,
  ContextSpotifyFeatures,
  FormattedLastFmStatus,
  FormattedSoulseekStatus,
  FormattedSoundcloudStatus,
  FormattedSpotifyStatus,
  FormattedStatus,
} from './utils'
import {
  formatLastFmStatus,
  formatSlskStatus,
  formatSoundcloudStatus,
  formatSpotifyStatus,
  formatStatus,
  makeDb,
  makeLastFm,
  setConfigFromEnv,
} from './utils'

type ServicesEndpoint =
  | StatusEndpoint
  | DestroyEndpoint
  | StartLastFmEndpoint
  | StopLastFmEndpoint
  | GetLastFmFriendsEndpoint
  | GetLastFmRecentTracksEndpoint
  | GetLastFmLovedTrackEndpoint
  | UpdateLastFmNowPlayingEndpoint
  | LastFmScrobbleEndpoint
  | LastFmLoveTrackEndpoint
  | LastFmUnloveTrackEndpoint
  | StartSoulseekEndpoint
  | StopSoulseekEndpoint
  | StartSoundcloudEndpoint
  | StopSoundcloudEndpoint
  | SoundcloudSearchTracksEndpoint
  | SoundcloudSearchAlbumsEndpoint
  | StartSpotifyEndpoint
  | StopSpotifyEndpoint
  | SpotifySearchEndpoint
  | GetSpotifyFriendActivityEndpoint
  | DownloadEndpoint

type StatusEndpoint = {
  request: { kind: 'status' }
  response: FormattedStatus
}

type DestroyEndpoint = {
  request: { kind: 'destroy' }
  response: { destroyed: true }
}

type StartLastFmEndpoint = {
  request: { kind: 'start-last-fm' }
  response: FormattedLastFmStatus
}
type StopLastFmEndpoint = {
  request: { kind: 'stop-last-fm' }
  response: FormattedLastFmStatus
}
type GetLastFmFriendsEndpoint = {
  request: { kind: 'get-last-fm-friends' }
  response: Awaited<ReturnType<LastFMAuthenticated['getFriends']>>
}
type GetLastFmRecentTracksEndpoint = {
  request: { kind: 'get-last-fm-recent-tracks'; username: string }
  response: Awaited<ReturnType<LastFMAuthenticated['getRecentTracks']>>
}
type GetLastFmLovedTrackEndpoint = {
  request: {
    kind: 'get-last-fm-loved-track'
    params: Parameters<LastFMAuthenticated['getLovedTrack']>
  }
  response: Awaited<ReturnType<LastFMAuthenticated['getLovedTrack']>>
}
type UpdateLastFmNowPlayingEndpoint = {
  request: {
    kind: 'update-last-fm-now-playing'
    params: Parameters<LastFMAuthenticated['updateNowPlaying']>
  }
  response: Awaited<ReturnType<LastFMAuthenticated['updateNowPlaying']>>
}
type LastFmScrobbleEndpoint = {
  request: {
    kind: 'last-fm-scrobble'
    params: Parameters<LastFMAuthenticated['scrobble']>
  }
  response: Awaited<ReturnType<LastFMAuthenticated['scrobble']>>
}
type LastFmLoveTrackEndpoint = {
  request: {
    kind: 'last-fm-love-track'
    params: Parameters<LastFMAuthenticated['loveTrack']>
  }
  response: Awaited<ReturnType<LastFMAuthenticated['loveTrack']>>
}
type LastFmUnloveTrackEndpoint = {
  request: {
    kind: 'last-fm-unlove-track'
    params: Parameters<LastFMAuthenticated['unloveTrack']>
  }
  response: Awaited<ReturnType<LastFMAuthenticated['unloveTrack']>>
}

type StartSoulseekEndpoint = {
  request: { kind: 'start-soulseek' }
  response: FormattedSoulseekStatus
}
type StopSoulseekEndpoint = {
  request: { kind: 'stop-soulseek' }
  response: FormattedSoulseekStatus
}
type SoulseekSearchEndpoint = {
  request: { kind: 'soulseek-search'; query: string; timeout?: number }
  response: Awaited<ReturnType<SlskClient['search']>>[number]
}

type StartSoundcloudEndpoint = {
  request: { kind: 'start-soundcloud' }
  response: FormattedSoundcloudStatus
}
type StopSoundcloudEndpoint = {
  request: { kind: 'stop-soundcloud' }
  response: FormattedSoundcloudStatus
}
type SoundcloudSearchTracksEndpoint = {
  request: {
    kind: 'soundcloud-search-tracks'
    params: Parameters<Soundcloud['searchTracks']>
  }
  response: Awaited<ReturnType<Soundcloud['searchTracks']>>
}
type SoundcloudSearchAlbumsEndpoint = {
  request: {
    kind: 'soundcloud-search-albums'
    params: Parameters<Soundcloud['searchAlbums']>
  }
  response: Awaited<ReturnType<Soundcloud['searchAlbums']>>
}

type StartSpotifyEndpoint = {
  request: { kind: 'start-spotify' }
  response: FormattedSpotifyStatus
}
type StopSpotifyEndpoint = {
  request: { kind: 'stop-spotify' }
  response: FormattedSpotifyStatus
}
type GetSpotifyFriendActivityEndpoint = {
  request: { kind: 'get-spotify-friend-activity' }
  response: Awaited<ReturnType<FriendActivityEnabled['getFriendActivity']>>
}
type SpotifySearchEndpoint = {
  request: { kind: 'spotify-search'; params: Parameters<WebApiEnabled['search']> }
  response: Awaited<ReturnType<WebApiEnabled['search']>>
}

type DownloadEndpoint = {
  request: { kind: 'download'; dl: Download }
  response: { ok: true }
}

export type ServicesRequestMap = {
  [K in ServicesEndpoint['request']['kind']]: Omit<
    Extract<ServicesEndpoint, { request: { kind: K } }>['request'],
    'kind'
  >
}
export type ServicesResponseMap = {
  [K in ServicesEndpoint['request']['kind']]: Extract<
    ServicesEndpoint,
    { request: { kind: K } }
  >['response']
}

type ServicesRequest = ServicesEndpoint['request']
type ServicesResponse<R extends ServicesRequest> = Extract<
  ServicesEndpoint,
  { request: R }
>['response']

export const makeWorker = async () => {
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
  setConfigFromEnv(db)

  let lastFm: ContextLastFm = { status: 'stopped' }
  let soulseek: ContextSlsk = { status: 'stopped' }
  let soundcloud: ContextSoundcloud = { status: 'stopped' }
  let spotify: ContextSpotify = spotifyStopped
  const downloader = new Downloader({
    getContext: () => ({ db, lfm: lastFm, slsk: soulseek, sc: soundcloud, sp: spotify }),
    downloadDir: env.DOWNLOAD_DIR,
    logger: log,
  })

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
  }
  const stopLastFm = () => {
    lastFm = { status: 'stopped' }
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
        return
      } else {
        log.debug('startSoulseek: Username is not configured')
        soulseek = {
          status: 'errored',
          error: new Error('Soulseek username is not configured'),
        }
        return
      }
    } else {
      if (!password) {
        log.debug('startSoulseek: Password is not configured')
        soulseek = {
          status: 'errored',
          error: new Error('Soulseek password is not configured'),
        }
        return
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
      return
    }

    log.debug('startSoulseek: Setting status')
    soulseek = withProps(slsk, { status: 'logged-in' } as const)
    log.debug('startSoulseek: Setting listeners')
    slsk
      .on('listen-error', (error) => log.error(error, 'SLSK listen error'))
      .on('server-error', (error) => log.error(error, 'SLSK server error'))
      .on('client-error', (error) => log.error(error, 'SLSK client error'))
    log.debug('startSoulseek: Done')
  }
  const stopSoulseek = () => {
    if (soulseek.status === 'logging-in' || soulseek.status === 'logged-in') {
      soulseek.destroy()
    }
    soulseek = { status: 'stopped' }
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
  }
  const stopSoundcloud = () => {
    soundcloud = { status: 'stopped' }
  }

  const startSpotify = async () => {
    spotify = spotifyStopped

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
      spotify = spotifyStopped
      return
    }

    const sp = Spotify(opts)

    spotify = {
      status: 'starting',
      features: spotifyNoFeatures,
      errors: spotifyNoErrors,
    }

    const errors: ContextSpotifyErrors = {}
    await Promise.all([
      (async () => {
        if (sp.downloads) {
          try {
            await sp.checkCredentials()
          } catch (e) {
            errors.downloads = e
          }
        }
      })(),
      (async () => {
        if (sp.friendActivity) {
          try {
            await sp.getFriendActivity()
          } catch (e) {
            errors.friendActivity = e
          }
        }
      })(),
      (async () => {
        if (sp.webApi) {
          try {
            await sp.getAccessToken()
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
      spotify = {
        status: 'errored',
        errors,
        features: spotifyNoFeatures,
      }
    } else if (someFailed) {
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
  }
  const stopSpotify = () => {
    spotify = spotifyStopped
  }

  await Promise.all([
    startLastFm(),
    ...(env.NODE_ENV === 'production' ? [startSoulseek()] : []),
    startSoundcloud(),
    startSpotify(),
  ])

  const handleRequest = async <R extends ServicesRequest>(
    request: R
  ): Promise<ServicesResponse<R>> => {
    switch (request.kind) {
      case 'status': {
        const response: StatusEndpoint['response'] = formatStatus({
          lastFm,
          soulseek,
          soundcloud,
          spotify,
        })
        return response as ServicesResponse<R>
      }
      case 'destroy': {
        db.close()
        downloader.close()
        if (soulseek.status === 'logging-in' || soulseek.status === 'logged-in') {
          soulseek.destroy()
        }
        const response: DestroyEndpoint['response'] = { destroyed: true }
        return response as ServicesResponse<R>
      }

      case 'start-last-fm': {
        await startLastFm()
        const response: StartLastFmEndpoint['response'] = formatLastFmStatus(lastFm)
        return response as ServicesResponse<R>
      }
      case 'stop-last-fm': {
        stopLastFm()
        const response: StopLastFmEndpoint['response'] = formatLastFmStatus(lastFm)
        return response as ServicesResponse<R>
      }
      case 'get-last-fm-friends': {
        if (lastFm.status !== 'logged-in') {
          throw new Error('Last.fm not logged in')
        }
        const response: GetLastFmFriendsEndpoint['response'] = await lastFm.getFriends()
        return response as ServicesResponse<R>
      }
      case 'get-last-fm-recent-tracks': {
        if (!('getRecentTracks' in lastFm)) {
          throw new Error('Last.fm recent tracks not available')
        }
        const response: GetLastFmRecentTracksEndpoint['response'] = await lastFm.getRecentTracks(
          request.username
        )
        return response as ServicesResponse<R>
      }
      case 'get-last-fm-loved-track': {
        if (lastFm.status !== 'logged-in') {
          throw new Error('Last.fm not logged in')
        }
        const response: GetLastFmLovedTrackEndpoint['response'] = await lastFm.getLovedTrack(
          ...request.params
        )
        return response as ServicesResponse<R>
      }
      case 'update-last-fm-now-playing': {
        if (lastFm.status !== 'logged-in') {
          throw new Error('Last.fm not logged in')
        }
        const response: UpdateLastFmNowPlayingEndpoint['response'] = await lastFm.updateNowPlaying(
          ...request.params
        )
        return response as ServicesResponse<R>
      }
      case 'last-fm-scrobble': {
        if (lastFm.status !== 'logged-in') {
          throw new Error('Last.fm not logged in')
        }
        const response: LastFmScrobbleEndpoint['response'] = await lastFm.scrobble(
          ...request.params
        )
        return response as ServicesResponse<R>
      }
      case 'last-fm-love-track': {
        if (lastFm.status !== 'logged-in') {
          throw new Error('Last.fm not logged in')
        }
        const response: LastFmLoveTrackEndpoint['response'] = await lastFm.loveTrack(
          ...request.params
        )
        return response as ServicesResponse<R>
      }
      case 'last-fm-unlove-track': {
        if (lastFm.status !== 'logged-in') {
          throw new Error('Last.fm not logged in')
        }
        const response: LastFmUnloveTrackEndpoint['response'] = await lastFm.unloveTrack(
          ...request.params
        )
        return response as ServicesResponse<R>
      }

      case 'start-soulseek': {
        await startSoulseek()
        const response: StartSoulseekEndpoint['response'] = formatSlskStatus(soulseek)
        return response as ServicesResponse<R>
      }
      case 'stop-soulseek': {
        stopSoulseek()
        const response: StopSoulseekEndpoint['response'] = formatSlskStatus(soulseek)
        return response as ServicesResponse<R>
      }

      case 'start-soundcloud': {
        await startSoundcloud()
        const response: StartSoundcloudEndpoint['response'] = formatSoundcloudStatus(soundcloud)
        return response as ServicesResponse<R>
      }
      case 'stop-soundcloud': {
        stopSoundcloud()
        const response: StopSoundcloudEndpoint['response'] = formatSoundcloudStatus(soundcloud)
        return response as ServicesResponse<R>
      }
      case 'soundcloud-search-tracks': {
        if (soundcloud.status !== 'running') {
          throw new Error('Soundcloud not running')
        }
        const response: SoundcloudSearchTracksEndpoint['response'] = await soundcloud.searchTracks(
          ...request.params
        )
        return response as ServicesResponse<R>
      }
      case 'soundcloud-search-albums': {
        if (soundcloud.status !== 'running') {
          throw new Error('Soundcloud not running')
        }
        const response: SoundcloudSearchAlbumsEndpoint['response'] = await soundcloud.searchAlbums(
          ...request.params
        )
        return response as ServicesResponse<R>
      }

      case 'start-spotify': {
        await startSpotify()
        const response: StartSpotifyEndpoint['response'] = formatSpotifyStatus(spotify)
        return response as ServicesResponse<R>
      }
      case 'stop-spotify': {
        stopSpotify()
        const response: StopSpotifyEndpoint['response'] = formatSpotifyStatus(spotify)
        return response as ServicesResponse<R>
      }
      case 'get-spotify-friend-activity': {
        if (!('getFriendActivity' in spotify)) {
          throw new Error('Spotify friend activity not available')
        }
        const response: GetSpotifyFriendActivityEndpoint['response'] =
          await spotify.getFriendActivity()
        return response as ServicesResponse<R>
      }
      case 'spotify-search': {
        if (!spotify.features.webApi || spotify.errors.webApi || !('search' in spotify)) {
          throw new Error('Spotify Web API not available')
        }
        const response: SpotifySearchEndpoint['response'] = await spotify.search(...request.params)
        return response as ServicesResponse<R>
      }

      case 'download': {
        await downloader.download(request.dl)
        const response: DownloadEndpoint['response'] = { ok: true }
        return response as ServicesResponse<R>
      }
    }
  }

  const handleMessage = (
    {
      id,
      data,
    }: {
      id: string
      data: SoulseekSearchEndpoint['request'] | ServicesRequest
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    postMessage: (value: any) => void
  ) => {
    if (data.kind === 'soulseek-search') {
      if (soulseek.status !== 'logged-in') {
        postMessage({ id, error: new Error('Soulseek not logged in') })
        return
      }
      void soulseek
        .search(data.query, {
          timeout: data.timeout,
          onResult: (result) => {
            postMessage({ id, data: result })
          },
        })
        .then(() => {
          postMessage({ id, ended: true })
        })
    } else {
      void handleRequest(data)
        .then((response) => {
          postMessage({ id, data: response })
        })
        .catch((error: unknown) => {
          postMessage({ id, error })
        })
    }
  }

  return { handleMessage }
}
