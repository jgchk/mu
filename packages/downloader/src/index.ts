import type { Database } from 'db'
import type { SlskClient } from 'soulseek-ts'
import type { Soundcloud } from 'soundcloud'
import type { Spotify } from 'spotify'

import { DownloadQueue } from './queue'
import { SoulseekDownloadManager } from './slsk'

export type Download = SoundcloudDownload | SpotifyDownload | SoulseekDownload

export type SoundcloudDownload = {
  service: 'soundcloud'
  type: 'track' | 'playlist'
  dbId: number
}

export type SpotifyDownload = {
  service: 'spotify'
  type: 'track' | 'album'
  dbId: number
}

export type SoulseekDownload = {
  service: 'soulseek'
  type: 'track'
  dbId: number
}

export type Context = {
  db: Database
  sc:
    | { status: 'stopped' }
    | { status: 'starting' }
    | { status: 'errored'; error: unknown }
    | ({ status: 'running' } & Soundcloud)
  sp:
    | { status: 'stopped' }
    | { status: 'starting' }
    | { status: 'errored'; errors: SpotifyErrors }
    | ({ status: 'degraded'; errors: SpotifyErrors } & Spotify)
    | ({ status: 'running' } & Spotify)
  slsk:
    | { status: 'stopped' }
    | { status: 'errored'; error: unknown }
    | { status: 'logging-in'; client: SlskClient }
    | { status: 'logged-in'; client: SlskClient }
}

export type SpotifyErrors = {
  downloads?: unknown
  friendActivity?: unknown
  webApi?: unknown
}

export type Logger = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  info: (...args: any[]) => any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  warn: (...args: any[]) => any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: (...args: any[]) => any
}

export class Downloader {
  private queue: DownloadQueue
  private soulseek: SoulseekDownloadManager

  constructor({
    getContext,
    downloadDir,
    logger: logger_,
    concurrency,
  }: {
    getContext: () => Context
    downloadDir: string
    logger?: Logger
    concurrency: number
  }) {
    const logger = logger_ ?? console
    this.queue = new DownloadQueue({
      getContext,
      downloadDir,
      logger,
      concurrency,
    })
    this.soulseek = new SoulseekDownloadManager({
      getContext,
      downloadDir,
      logger,
    })
  }

  setConcurrency(concurrency: number) {
    this.queue.setConcurrency(concurrency)
  }

  async download(download: Download) {
    if (download.service === 'soulseek') {
      await this.soulseek.downloadTrack(download.dbId)
    } else {
      await this.queue.queue(download)
    }
  }

  close() {
    this.queue.close()
    this.soulseek.close()
  }
}
