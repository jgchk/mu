import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { fileExists } from 'utils/node'

import type { Context } from '.'

export type SoulseekDownload = {
  service: 'soulseek'
  type: 'track'
  dbId: number
}

export class SoulseekDownloadManager {
  private getContext: () => Context
  private downloadDir: string
  private openFiles: Map<number, fs.WriteStream>

  constructor({ getContext, downloadDir }: { getContext: () => Context; downloadDir: string }) {
    this.getContext = getContext
    this.downloadDir = downloadDir
    this.openFiles = new Map()
  }

  async downloadTrack(dbId: number) {
    const { slsk, db } = this.getContext()

    try {
      if (!slsk) {
        throw new Error('Soulseek is not running')
      }

      const existingPipe = this.openFiles.get(dbId)
      if (existingPipe) {
        console.error('Already downloading track', dbId)
        return
      }

      const dbTrack = db.soulseekTrackDownloads.get(dbId)

      if (dbTrack.status === 'done') {
        console.error('Track already downloaded', dbId)
        return
      }

      db.soulseekTrackDownloads.update(dbId, {
        status: 'downloading',
        progress: dbTrack.progress ?? 0,
      })

      let filePath = dbTrack.path
      if (!filePath) {
        const fileHash = crypto.createHash('sha256')
        fileHash.update(dbTrack.file)
        const hashedFile = fileHash.digest('hex').slice(0, 8)

        const extension = path.extname(dbTrack.file)
        const fileName = `slsk-${hashedFile}-${Date.now()}-${crypto.randomInt(0, 10)}${extension}`
        filePath = path.join(this.downloadDir, fileName)
        db.soulseekTrackDownloads.update(dbId, { path: filePath })
      }

      await fs.promises.mkdir(path.dirname(filePath), { recursive: true })

      let downloadedBytes = 0
      const fileAlreadyExists = await fileExists(filePath)
      if (fileAlreadyExists) {
        downloadedBytes = (await fs.promises.stat(filePath)).size
      }

      const slskDownload = await slsk.download(dbTrack.username, dbTrack.file, downloadedBytes)

      const fsPipe = fs.createWriteStream(filePath, { flags: 'a' })
      this.openFiles.set(dbId, fsPipe)
      slskDownload.stream.pipe(fsPipe)

      slskDownload.events
        .on('progress', ({ progress }) => {
          db.soulseekTrackDownloads.update(dbId, { progress: Math.floor(progress * 100) })
        })
        .on('complete', () => {
          this.openFiles.delete(dbId)
          db.soulseekTrackDownloads.update(dbId, { progress: 100, status: 'done' })
        })
    } catch (error) {
      db.soulseekTrackDownloads.update(dbId, { status: 'error', error })
    }
  }

  close() {
    for (const [dbId, pipe] of this.openFiles) {
      pipe.close()
      this.openFiles.delete(dbId)
    }
  }
}
