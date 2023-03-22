import type { Database } from 'db'
import type { DownloadQueue } from 'downloader'
import type { SlskClient } from 'soulseek-ts'
import type { Soundcloud } from 'soundcloud'
import type { Spotify } from 'spotify'

export type Context = {
  db: Database
  dl: DownloadQueue
  sc: Soundcloud
  sp: Spotify
  slsk: SlskClient
  musicDir: string
}
