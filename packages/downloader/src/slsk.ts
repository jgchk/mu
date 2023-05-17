import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { toErrorString } from 'utils'
import { ensureDir, fileExists } from 'utils/node'

import type { Context, Logger } from '.'

export type SoulseekDownload = {
  service: 'soulseek'
  type: 'track'
  dbId: number
}

export class SoulseekDownloadManager {
  private getContext: () => Context
  private downloadDir: string
  private openFiles: Map<number, fs.WriteStream>
  private logger: Logger

  constructor({
    getContext,
    downloadDir,
    logger,
  }: {
    getContext: () => Context
    downloadDir: string
    logger: Logger
  }) {
    this.getContext = getContext
    this.downloadDir = downloadDir
    this.openFiles = new Map()
    this.logger = logger
  }

  async downloadTrack(dbId: number) {
    const { slsk, db } = this.getContext()

    try {
      if (slsk.status === 'stopped') {
        throw new Error('Soulseek is not running')
      } else if (slsk.status === 'errored') {
        throw new Error(`Soulseek ran into an error: ${toErrorString(slsk.error)}`, {
          cause: slsk.error,
        })
      } else if (slsk.status === 'logging-in') {
        throw new Error('Soulseek is logging in')
      }

      const existingPipe = this.openFiles.get(dbId)
      if (existingPipe) {
        this.logger.error('Already downloading track', dbId)
        return
      }

      const dbTrack = db.soulseekTrackDownloads.get(dbId)

      if (dbTrack.status === 'done') {
        this.logger.error('Track already downloaded', dbId)
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

      await ensureDir(path.dirname(filePath))

      let downloadedBytes = 0
      const fileAlreadyExists = await fileExists(filePath)
      if (fileAlreadyExists) {
        downloadedBytes = (await fs.promises.stat(filePath)).size
      }

      const slskDownload = await slsk.client.download(
        dbTrack.username,
        dbTrack.file,
        downloadedBytes
      )

      const fsPipe = fs.createWriteStream(filePath, { flags: 'a' })
      this.openFiles.set(dbId, fsPipe)
      slskDownload.stream.pipe(fsPipe)

      let lastUpdate: Date | undefined = undefined
      slskDownload.events
        .on('progress', ({ progress }) => {
          // update every second
          if (lastUpdate === undefined || Date.now() - lastUpdate.getTime() > 1000) {
            db.soulseekTrackDownloads.update(dbId, { progress: Math.floor(progress * 100) })
            lastUpdate = new Date()
          }
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
