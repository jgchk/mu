import type { Database } from 'db'
import type { Downloader } from 'downloader'
import type { LastFM, LastFMAuthenticated } from 'last-fm'
import type { SlskClient } from 'soulseek-ts'
import type { Soundcloud } from 'soundcloud'
import type { Spotify } from 'spotify'

export type Context = {
  db: Database
  dl: Downloader
  sc: ContextSoundcloud
  sp: ContextSpotify
  slsk: ContextSlsk
  lfm: ContextLastFm
  musicDir: string

  startSoulseek: () => Promise<ContextSlsk>
  stopSoulseek: () => ContextSlsk

  updateLastFM: () => Promise<ContextLastFm>

  startSpotify: () => Promise<ContextSpotify>
  stopSpotify: () => ContextSpotify

  startSoundcloud: () => Promise<ContextSoundcloud>
  stopSoundcloud: () => ContextSoundcloud

  destroy: () => void
}

export type ContextLastFm =
  | { status: 'stopped' }
  | { status: 'errored'; error: unknown }
  | ({ status: 'authenticating' } & LastFM)
  | ({ status: 'authenticated' } & LastFM)
  | ({ status: 'logging-in' } & LastFM)
  | ({ status: 'degraded'; error: unknown } & LastFM)
  | ({ status: 'logged-in' } & LastFMAuthenticated)

export type ContextSlsk =
  | { status: 'stopped' }
  | { status: 'errored'; error: unknown }
  | ({ status: 'logging-in' } & SlskClient)
  | ({ status: 'logged-in' } & SlskClient)

export type ContextSpotify =
  | { status: 'stopped' }
  | { status: 'starting' }
  | { status: 'errored'; errors: ContextSpotifyErrors }
  | ({ status: 'degraded'; errors: ContextSpotifyErrors } & Spotify)
  | ({ status: 'running' } & Spotify)

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
