import type { Database } from 'db'
import type { Downloader } from 'downloader'
import type { LastFM, LastFMAuthenticated } from 'last-fm'
import type { SlskClient } from 'soulseek-ts'
import type { Soundcloud } from 'soundcloud'
import type { Spotify } from 'spotify'

export type Context = {
  db: Database
  dl: Downloader
  sc: Soundcloud
  sp: Spotify
  slsk: ContextSlsk
  lfm: ContextLastFm
  musicDir: string

  startSoulseek: () => Promise<ContextSlsk>
  stopSoulseek: () => ContextSlsk

  updateLastFM: () => Promise<ContextLastFm>

  destroy: () => void
}

export type ContextLastFm =
  | { available: false; error: unknown }
  | ({ available: true; error?: unknown } & LastFM)
  | ({ available: true } & LastFMAuthenticated)

export type ContextSlsk =
  | { status: 'stopped' }
  | { status: 'errored'; error: unknown }
  | ({ status: 'logging-in' } & SlskClient)
  | ({ status: 'logged-in' } & SlskClient)
