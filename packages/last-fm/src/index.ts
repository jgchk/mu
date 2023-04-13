import crypto from 'crypto'
import got from 'got'

import { Friends, LovedTracks, MobileSession, NowPlaying, RecentTracks, Scrobble } from './model'

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

export class LastFM {
  apiKey: string

  constructor({ apiKey }: { apiKey: string }) {
    this.apiKey = apiKey
  }

  async login(info: { username: string; password: string; apiSecret: string }) {
    const sessionKey = await getSessionKey({
      ...info,
      apiKey: this.apiKey,
    })
    return new LastFMAuthenticated({
      ...info,
      apiKey: this.apiKey,
      sessionKey,
    })
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
}

export class LastFMAuthenticated extends LastFM {
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
