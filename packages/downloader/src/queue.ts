import { randomInt } from 'crypto'
import type { Database } from 'db'
import fastq from 'fastq'
import fs from 'fs'
import path from 'path'
import type { SlskClient } from 'soulseek-ts'
import type { FullTrack as SoundcloudFullTrack, Soundcloud } from 'soundcloud'
import type { SimplifiedTrack as SpotifySimplifiedTrack, Spotify } from 'spotify'

import { SoundcloudQueue } from './soundcloud-queue'
import { fileExists } from './utils/fs'

export type SoundcloudTrackDownload = {
  service: 'soundcloud'
  kind: 'track'
  id: number
  dbId?: number
}
export type SoundcloudPlaylistDownload = {
  service: 'soundcloud'
  kind: 'playlist'
  id: number
}

export type SpotifyTrackDownload = {
  service: 'spotify'
  kind: 'track'
  id: string
  dbId?: number
}
export type SpotifyAlbumDownload = {
  service: 'spotify'
  kind: 'album'
  id: string
}

export type SoulseekTrackDownload = {
  service: 'soulseek'
  kind: 'track'
  username: string
  file: string
  dbId?: number
}

export type Task = MetadataTask | DownloadTrackTask
export type MetadataTask = {
  task: 'metadata'
  input:
    | SoundcloudTrackDownload
    | SoundcloudPlaylistDownload
    | SpotifyTrackDownload
    | SpotifyAlbumDownload
    | SoulseekTrackDownload
}
export type DownloadTrackTask = {
  task: 'download-track'
  input:
    | {
        service: 'soundcloud'
        track: SoundcloudFullTrack
        dbId: number
      }
    | { service: 'spotify'; track: SpotifySimplifiedTrack; dbId: number }
    | { service: 'soulseek'; username: string; file: string; dbId: number }
}

export class DownloadQueue {
  private q: fastq.queueAsPromised<Task>
  private scq: SoundcloudQueue
  private db: Database
  private sp: Spotify
  private slsk: SlskClient
  private downloadDir: string

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
    this.db = db
    this.sp = sp
    this.slsk = slsk
    this.downloadDir = downloadDir
    this.scq = new SoundcloudQueue({ db, sc, downloadDir })
    this.q = fastq.promise(this.worker.bind(this), 1)
    this.q.error((err, task) => {
      if (err) {
        console.error('ERROR', err, task)
      }
    })
  }

  queue(dl: MetadataTask['input']) {
    return this.q.push({ task: 'metadata', input: dl })
  }

  close() {
    this.q.kill()
    this.scq.close()
  }

  private async worker(task: Task) {
    const newTasks = await this.runTask(task)
    for (const newTask of newTasks) {
      void this.q.push(newTask)
    }
  }

  async runTask(task: Task): Promise<Task[]> {
    switch (task.task) {
      case 'metadata':
        return this.runMetadata(task)
      case 'download-track':
        return this.runDownloadTrack(task)
    }
  }

  async runMetadata(task: MetadataTask): Promise<Task[]> {
    switch (task.input.service) {
      case 'soundcloud': {
        switch (task.input.kind) {
          case 'playlist': {
            const dbPlaylist =
              this.db.soundcloudPlaylistDownloads.getByPlaylistId(task.input.id) ??
              this.db.soundcloudPlaylistDownloads.insert({ playlistId: task.input.id })
            void this.scq.queue({ type: 'playlist', dbId: dbPlaylist.id })
            break
          }
          case 'track': {
            const dbTrack =
              this.db.soundcloudTrackDownloads.getByTrackIdAndPlaylistDownloadId(
                task.input.id,
                null
              ) ?? this.db.soundcloudTrackDownloads.insert({ trackId: task.input.id })
            void this.scq.queue({ type: 'track', dbId: dbTrack.id })
            break
          }
        }
        return []
      }
      case 'spotify': {
        switch (task.input.kind) {
          case 'track': {
            const downloadId =
              task.input.dbId ??
              this.db.trackDownloads.insert({
                service: task.input.service,
                serviceId: task.input.id,
                complete: false,
              }).id
            const track = await this.sp.getTrack(task.input.id)
            this.db.trackDownloads.update(downloadId, { name: track.name })
            return [
              {
                task: 'download-track',
                input: { service: 'spotify', track, dbId: downloadId },
              },
            ]
          }
          case 'album': {
            const releaseDownload = this.db.releaseDownloads.insert({})
            const album = await this.sp.getAlbum(task.input.id)
            this.db.releaseDownloads.update(releaseDownload.id, { name: album.name })

            const tracks = await this.sp.getAlbumTracks(task.input.id)
            return tracks.map((track) => {
              const trackDownload = this.db.trackDownloads.insert({
                service: task.input.service,
                serviceId: track.id,
                complete: false,
                releaseDownloadId: releaseDownload.id,
                name: track.name,
              })
              return {
                task: 'download-track',
                input: { service: 'spotify', track, dbId: trackDownload.id },
              }
            })
          }
        }
      }
      case 'soulseek': {
        switch (task.input.kind) {
          case 'track': {
            const dirparts = task.input.file.replaceAll('\\', '/').split('/')
            const basename = dirparts[dirparts.length - 1]
            const downloadId =
              task.input.dbId ??
              this.db.trackDownloads.insert({
                service: 'soulseek',
                serviceId: task.input.file,
                name: basename,
                complete: false,
              }).id
            return [
              {
                task: 'download-track',
                input: {
                  service: 'soulseek',
                  username: task.input.username,
                  file: task.input.file,
                  dbId: downloadId,
                },
              },
            ]
          }
        }
      }
    }
  }

  runDownloadTrack = async (task: DownloadTrackTask): Promise<Task[]> => {
    switch (task.input.service) {
      case 'soundcloud': {
        return []
      }
      case 'spotify': {
        const fileName = `spot-${task.input.track.id}-${Date.now()}-${randomInt(0, 10)}.ogg`
        const filePath = path.resolve(path.join(this.downloadDir, fileName))

        await fs.promises.mkdir(path.dirname(filePath), { recursive: true })
        const alreadyExists = await fileExists(filePath)
        if (alreadyExists) {
          await fs.promises.rm(filePath)
        }

        const fsPipe = fs.createWriteStream(filePath)
        const pipe = this.sp.downloadTrack(task.input.track.id)
        pipe.pipe(fsPipe)

        await new Promise((resolve) => {
          pipe.on('close', resolve)
        })

        this.db.trackDownloads.update(task.input.dbId, { complete: true, path: filePath })

        return []
      }
      case 'soulseek': {
        const extension = path.extname(task.input.file)
        const fileName = `slsk-${task.input.dbId}-${Date.now()}-${randomInt(0, 10)}${extension}`
        const filePath = path.resolve(path.join(this.downloadDir, fileName))

        await fs.promises.mkdir(path.dirname(filePath), { recursive: true })
        const alreadyExists = await fileExists(filePath)
        if (alreadyExists) {
          // TODO: pass size to download task
          await fs.promises.rm(filePath)
        }

        const fsPipe = fs.createWriteStream(filePath)
        const dataStream = await this.slsk.download(task.input.username, task.input.file)
        dataStream.pipe(fsPipe)

        await new Promise((resolve) => {
          dataStream.on('close', resolve)
        })

        this.db.trackDownloads.update(task.input.dbId, { complete: true, path: filePath })

        return []
      }
    }
  }
}
