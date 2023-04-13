import type { Database } from 'db'
import type { Downloader } from 'downloader'
import type { LastFMAuthenticated } from 'last-fm'
import type { SlskClient } from 'soulseek-ts'
import type { Soundcloud } from 'soundcloud'
import type { Spotify } from 'spotify'

export type Context = {
  db: Database
  dl: Downloader
  sc: Soundcloud
  sp: Spotify
  slsk: SlskClient | undefined
  lfm: LastFMAuthenticated
  musicDir: string

  startSoulseek: () => Promise<void>
  stopSoulseek: () => void
  restartSoulseek: () => Promise<void>

  destroy: () => void
}
