import crypto from 'crypto'
import got, { HTTPError } from 'got'
import { hasMessage, isObject } from 'utils'

import {
  ErrorResponse,
  Friends,
  LovedTracks,
  MobileSession,
  NowPlaying,
  RecentTracks,
  Scrobble,
  TrackInfo,
  TrackInfoUser,
} from './model'

export * from './model'

const getApiSignature = (params: Record<string, string>, apiSecret: string) => {
  let sig = ''
  Object.keys(params)
    .sort()
    .forEach(function (key) {
      if (key != 'format') {
        const value = typeof params[key] !== 'undefined' && params[key] !== null ? params[key] : ''
        sig += key + value
      }
    })
  sig += apiSecret
  return crypto.createHash('md5').update(sig, 'utf8').digest('hex')
}

const getSessionKey = async ({
  username,
  password,
  apiKey,
  apiSecret,
}: {
  username: string
  password: string
  apiKey: string
  apiSecret: string
}) => {
  const params = {
    method: 'auth.getMobileSession',
    username: username,
    password: password,
    api_key: apiKey,
    format: 'json',
  }

  const res = await got
    .post('https://ws.audioscrobbler.com/2.0/', {
      form: {
        ...params,
        api_sig: getApiSignature(params, apiSecret),
      },
    })
    .json()

  return MobileSession.parse(res).session.key
}

export class LastFMBase {
  loggedIn = false
  apiKey: string

  constructor({ apiKey }: { apiKey: string }) {
    this.apiKey = apiKey
  }

  async login(info: { username: string; password: string; apiSecret: string }) {
    try {
      const sessionKey = await getSessionKey({
        ...info,
        apiKey: this.apiKey,
      })
      return new LastFMAuthenticated({
        ...info,
        apiKey: this.apiKey,
        sessionKey,
      })
    } catch (e) {
      let error = e
      if (e instanceof HTTPError && typeof e.response.body === 'string') {
        try {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          const body = JSON.parse(e.response.body)
          if (isObject(body)) {
            if ('error' in body && typeof body.error === 'number' && body.error === 4) {
              error = new Error('Invalid login')
            } else if (hasMessage(body)) {
              error = new Error(body.message)
            }
          }
        } catch {
          // ignore
        }
      }
      throw error
    }
  }

  async getFriends(username: string) {
    const res = await got('https://ws.audioscrobbler.com/2.0/', {
      searchParams: {
        method: 'user.getFriends',
        user: username,
        api_key: this.apiKey,
        format: 'json',
      },
    }).json()
    return Friends.parse(res).friends.user
  }

  async getRecentTracks(username: string) {
    const res = await got('https://ws.audioscrobbler.com/2.0/', {
      searchParams: {
        method: 'user.getRecentTracks',
        user: username,
        extended: 1,
        api_key: this.apiKey,
        format: 'json',
      },
    }).json()
    return RecentTracks.parse(res).recenttracks.track
  }

  async getLovedTracks(username: string, opts: { limit?: number; page?: number } = {}) {
    const res = await got('https://ws.audioscrobbler.com/2.0/', {
      searchParams: {
        method: 'user.getLovedTracks',
        user: username,
        limit: opts.limit,
        page: opts.page,
        api_key: this.apiKey,
        format: 'json',
      },
    }).json()
    return LovedTracks.parse(res).lovedtracks
  }

  async getAllLovedTracks(username: string) {
    const page1 = await this.getLovedTracks(username, { limit: 1000 })

    const allPages = Array.from({ length: parseInt(page1['@attr'].totalPages) }, (_, i) => i + 1)

    const restPages = await Promise.all(
      allPages.slice(1).map((page) => this.getLovedTracks(username, { limit: 1000, page }))
    )

    return [...page1.track, ...restPages.flatMap((page) => page.track)]
  }

  async getTrackInfo({ artist, track }: { artist: string; track: string }) {
    const res = await got('https://ws.audioscrobbler.com/2.0/', {
      searchParams: {
        method: 'track.getInfo',
        artist: artist,
        track: track,
        api_key: this.apiKey,
        format: 'json',
      },
    }).json()
    return TrackInfo.parse(res).track
  }

  async getTrackInfoUser(
    {
      artist,
      track,
    }: {
      artist: string
      track: string
    },
    username: string
  ) {
    const res = await got('https://ws.audioscrobbler.com/2.0/', {
      searchParams: {
        method: 'track.getInfo',
        artist: artist,
        track: track,
        username: username,
        api_key: this.apiKey,
        format: 'json',
      },
    }).json()
    const parsed = TrackInfoUser.or(ErrorResponse).parse(res)
    if ('error' in parsed) {
      throw new Error(`Error getting track info for ${artist} - ${track}: ${parsed.message}`)
    } else {
      return parsed.track
    }
  }

  async getLovedTrack(
    {
      artist,
      track,
    }: {
      artist: string
      track: string
    },
    username: string
  ) {
    try {
      const res = await this.getTrackInfoUser({ artist, track }, username)
      return res.userloved === '1'
    } catch (e) {
      if (e instanceof Error && e.message.includes('Track not found')) {
        return false
      } else {
        throw e
      }
    }
  }
}

export class LastFM extends LastFMBase {
  loggedIn = false as const
}

export class LastFMAuthenticated extends LastFMBase {
  loggedIn = true as const
  apiSecret: string
  username: string
  password: string
  sessionKey: string

  constructor({
    apiKey,
    apiSecret,
    username,
    password,
    sessionKey,
  }: {
    apiKey: string
    apiSecret: string
    username: string
    password: string
    sessionKey: string
  }) {
    super({ apiKey })
    this.apiSecret = apiSecret
    this.username = username
    this.password = password
    this.sessionKey = sessionKey
  }

  getApiSignature(params: Record<string, string>) {
    return getApiSignature(params, this.apiSecret)
  }

  getFriends(username = this.username) {
    return super.getFriends(username)
  }

  getRecentTracks(username = this.username) {
    return super.getRecentTracks(username)
  }

  getLovedTracks(username = this.username, opts: { limit?: number; page?: number } = {}) {
    return super.getLovedTracks(username, opts)
  }

  getAllLovedTracks(username = this.username) {
    return super.getAllLovedTracks(username)
  }

  getTrackInfoUser({ artist, track }: { artist: string; track: string }, username = this.username) {
    return super.getTrackInfoUser({ artist, track }, username)
  }

  getLovedTrack({ artist, track }: { artist: string; track: string }, username = this.username) {
    return super.getLovedTrack({ artist, track }, username)
  }

  async updateNowPlaying({
    artist,
    track,
    album,
    trackNumber,
    duration,
    albumArtist,
  }: {
    artist: string
    track: string
    album?: string
    trackNumber?: number | string
    duration?: number | string
    albumArtist?: string
  }) {
    const params = {
      method: 'track.updateNowPlaying',
      artist,
      track,
      ...(album ? { album } : {}),
      ...(trackNumber ? { trackNumber: trackNumber.toString() } : {}),
      ...(duration ? { duration: duration.toString() } : {}),
      ...(albumArtist ? { albumArtist } : {}),
      api_key: this.apiKey,
      sk: this.sessionKey,
      format: 'json',
    }
    const res = await got
      .post('https://ws.audioscrobbler.com/2.0/', {
        form: {
          ...params,
          api_sig: this.getApiSignature(params),
        },
      })
      .json()
    return NowPlaying.parse(res).nowplaying
  }

  async scrobble({
    artist,
    track,
    timestamp,
    album,
    chosenByUser,
    trackNumber,
    albumArtist,
    duration,
  }: {
    artist: string
    track: string
    timestamp: number | string | Date
    album?: string
    chosenByUser?: boolean
    trackNumber?: number | string
    albumArtist?: string
    duration?: number | string
  }) {
    const params = {
      method: 'track.scrobble',
      artist,
      track,
      timestamp:
        timestamp instanceof Date
          ? Math.round(timestamp.getTime() / 1000).toString()
          : timestamp.toString(),
      ...(album ? { album } : {}),
      ...(chosenByUser ? { chosenByUser: chosenByUser ? '1' : '0' } : {}),
      ...(trackNumber ? { trackNumber: trackNumber.toString() } : {}),
      ...(albumArtist ? { albumArtist } : {}),
      ...(duration ? { duration: duration.toString() } : {}),
      api_key: this.apiKey,
      sk: this.sessionKey,
      format: 'json',
    }
    const res = await got
      .post('https://ws.audioscrobbler.com/2.0/', {
        form: {
          ...params,
          api_sig: this.getApiSignature(params),
        },
      })
      .json()
    return Scrobble.parse(res).scrobbles
  }

  async loveTrack({ track, artist }: { track: string; artist: string }) {
    const params = {
      method: 'track.love',
      track,
      artist,
      api_key: this.apiKey,
      sk: this.sessionKey,
      format: 'json',
    }
    await got
      .post('https://ws.audioscrobbler.com/2.0/', {
        form: {
          ...params,
          api_sig: this.getApiSignature(params),
        },
      })
      .json()
  }

  async unloveTrack({ track, artist }: { track: string; artist: string }) {
    const params = {
      method: 'track.unlove',
      track,
      artist,
      api_key: this.apiKey,
      sk: this.sessionKey,
      format: 'json',
    }
    await got
      .post('https://ws.audioscrobbler.com/2.0/', {
        form: {
          ...params,
          api_sig: this.getApiSignature(params),
        },
      })
      .json()
  }
}
