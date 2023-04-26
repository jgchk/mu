import type { Database } from 'db'
import type { Downloader } from 'downloader'
import type { ImageManager } from 'image-manager'
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
  img: ImageManager
  imagesDir: string
  musicDir: string

  startSoulseek: () => Promise<ContextSlsk>
  stopSoulseek: () => ContextSlsk

  startLastFm: () => Promise<ContextLastFm>
  stopLastFm: () => ContextLastFm

  startSpotify: () => Promise<ContextSpotify>
  stopSpotify: () => ContextSpotify

  startSoundcloud: () => Promise<ContextSoundcloud>
  stopSoundcloud: () => ContextSoundcloud

  destroy: () => void
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
