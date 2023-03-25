import crypto from 'crypto'
import type { Database } from 'db'
import fs from 'fs'
import path from 'path'
import type { SlskClient } from 'soulseek-ts'

import { fileExists } from './utils/fs'

export type SoulseekDownload = {
  service: 'soulseek'
  type: 'track'
  dbId: number
}

export class SoulseekDownloadManager {
  private slsk: SlskClient
  private db: Database
  private downloadDir: string
  private openFiles: Map<number, fs.WriteStream>

  constructor({ slsk, db, downloadDir }: { slsk: SlskClient; db: Database; downloadDir: string }) {
    this.slsk = slsk
    this.db = db
    this.downloadDir = downloadDir
    this.openFiles = new Map()
  }

  async downloadTrack(dbId: number) {
    const existingPipe = this.openFiles.get(dbId)
    if (existingPipe) {
      console.error('Already downloading track', dbId)
      return
    }

    const dbTrack = this.db.soulseekTrackDownloads.get(dbId)

    if (dbTrack.progress === 100) {
      console.error('Track already downloaded', dbId)
      return
    }

    let filePath = dbTrack.path
    if (!filePath) {
      const fileHash = crypto.createHash('sha256')
      fileHash.update(dbTrack.file)
      const hashedFile = fileHash.digest('hex').slice(0, 8)

      const extension = path.extname(dbTrack.file)
      const fileName = `slsk-${hashedFile}-${Date.now()}-${crypto.randomInt(0, 10)}${extension}`
      filePath = path.resolve(path.join(this.downloadDir, fileName))
      this.db.soulseekTrackDownloads.update(dbId, { path: filePath })
    }

    await fs.promises.mkdir(path.dirname(filePath), { recursive: true })

    let downloadedBytes = 0
    const fileAlreadyExists = await fileExists(filePath)
    if (fileAlreadyExists) {
      downloadedBytes = (await fs.promises.stat(filePath)).size
    }

    const slskDownload = await this.slsk.download(dbTrack.username, dbTrack.file, downloadedBytes)

    const fsPipe = fs.createWriteStream(filePath)
    this.openFiles.set(dbId, fsPipe)
    slskDownload.stream.pipe(fsPipe)

    slskDownload.events
      .on('progress', ({ progress }) => {
        this.db.soulseekTrackDownloads.update(dbId, { progress: Math.floor(progress * 100) })
      })
      .on('complete', () => {
        this.openFiles.delete(dbId)
        this.db.soulseekTrackDownloads.update(dbId, { progress: 100 })
      })
  }

  close() {
    for (const [dbId, pipe] of this.openFiles) {
      pipe.close()
      this.openFiles.delete(dbId)
    }
  }
}
