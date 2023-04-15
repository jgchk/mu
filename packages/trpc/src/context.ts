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
  slsk: SlskClient | undefined
  lfm: ContextLastFm
  musicDir: string

  startSoulseek: () => Promise<void>
  stopSoulseek: () => void
  restartSoulseek: () => Promise<void>

  updateLastFM: () => Promise<ContextLastFm>

  destroy: () => void
}

export type ContextLastFm =
  | { available: false; error: Error }
  | ({ available: true; error?: Error } & LastFM)
  | ({ available: true } & LastFMAuthenticated)
