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

export class Downloader {
  private queue: DownloadQueue
  private soulseek: SoulseekDownloadManager

  constructor({
    db,
    sc,
    sp,
    slsk,
    downloadDir,
  }: {
    db: Database
    sc: Soundcloud
    sp: Spotify
    slsk: SlskClient
    downloadDir: string
  }) {
    this.queue = new DownloadQueue({
      db,
      sc,
      sp,
      downloadDir,
    })
    this.soulseek = new SoulseekDownloadManager({
      slsk,
      db,
      downloadDir,
    })
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
