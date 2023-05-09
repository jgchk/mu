import { pipe } from 'utils'

import { SpotifyBase } from './features/base'
import type { DownloadsParams } from './features/downloads'
import { DownloadsMixin } from './features/downloads'
import type { FriendActivityParams } from './features/friends'
import { FriendActivityMixin } from './features/friends'
import type { WebApiParams } from './features/web-api'
import { WebApiMixin } from './features/web-api'

export * from './model'

export { uriToUrl, parseUri } from './features/base'

export type SpotifyOptions = {
  downloads?: DownloadsParams
  friendActivity?: FriendActivityParams
  webApi?: WebApiParams
}

export function Spotify(opts?: SpotifyOptions) {
  const Spotify = pipe(
    SpotifyBase,
    DownloadsMixin(opts?.downloads),
    FriendActivityMixin(opts?.friendActivity),
    WebApiMixin(opts?.webApi)
  )
  return new Spotify()
}

export type Spotify = ReturnType<typeof Spotify>
