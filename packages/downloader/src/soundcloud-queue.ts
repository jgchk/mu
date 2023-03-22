import { randomInt } from 'crypto'
import type { Database } from 'db'
import fastq from 'fastq'
import fs from 'fs'
import type { Metadata } from 'music-metadata'
import { parseArtistTitle, writeTrackCoverArt, writeTrackMetadata } from 'music-metadata'
import path from 'path'
import { Soundcloud } from 'soundcloud'

import { uniqBy } from './utils/array'
import { fileExists } from './utils/fs'
import { ifNotNull } from './utils/types'

export type SoundcloudTask = {
  type: 'track' | 'playlist'
  dbId: number
}

export class SoundcloudQueue {
  private q: fastq.queueAsPromised<SoundcloudTask>
  private db: Database
  private sc: Soundcloud
  private downloadDir: string

  constructor({ db, sc, downloadDir }: { db: Database; sc: Soundcloud; downloadDir: string }) {
    this.db = db
    this.sc = sc
    this.downloadDir = downloadDir
    this.q = fastq.promise(this.worker.bind(this), 1)
    this.q.error((err, task) => {
      if (err) {
        console.error('Error processing task:', task, err)
      }
    })
  }

  queue(task: SoundcloudTask) {
    return this.q.push(task)
  }

  close() {
    this.q.kill()
  }

  private async worker(task: SoundcloudTask) {
    if (task.type === 'playlist') {
      const dbPlaylist = this.db.soundcloudPlaylistDownloads.get(task.dbId)

      let scPlaylist = dbPlaylist.playlist
      if (!scPlaylist) {
        scPlaylist = await this.sc.getPlaylist(dbPlaylist.playlistId)
        this.db.soundcloudPlaylistDownloads.update(task.dbId, { playlist: scPlaylist })
      }

      const tracks = uniqBy(scPlaylist.tracks, (track) => track.id)

      const dbTracks = await Promise.all(
        tracks.map(async (track) => {
          const dbTrack =
            this.db.soundcloudTrackDownloads.getByTrackIdAndPlaylistDownloadId(
              track.id,
              dbPlaylist.id
            ) ??
            this.db.soundcloudTrackDownloads.insert({
              trackId: track.id,
              playlistDownloadId: dbPlaylist.id,
            })

          let scTrack = dbTrack.track
          if (!scTrack) {
            scTrack = await this.sc.getTrack(dbTrack.trackId)
            this.db.soundcloudTrackDownloads.update(dbTrack.id, { track: scTrack })
          }

          return dbTrack
        })
      )

      for (const dbTrack of dbTracks) {
        void this.q.push({ type: 'track', dbId: dbTrack.id })
      }
    } else if (task.type === 'track') {
      const dbTrack = this.db.soundcloudTrackDownloads.get(task.dbId)

      if (dbTrack.progress === 100) {
        return
      }

      let scTrack = dbTrack.track
      if (!scTrack) {
        scTrack = await this.sc.getTrack(dbTrack.trackId)
        this.db.soundcloudTrackDownloads.update(task.dbId, { track: scTrack })
      }

      const { pipe: dlPipe, extension } = await this.sc.downloadTrack(scTrack)

      let filePath = dbTrack.path
      if (!filePath) {
        filePath = path.resolve(
          path.join(
            this.downloadDir,
            `sc-${scTrack.id}-${Date.now()}-${randomInt(0, 10)}.${extension}`
          )
        )
        this.db.soundcloudTrackDownloads.update(task.dbId, { path: filePath })
      }

      await fs.promises.mkdir(path.dirname(filePath), { recursive: true })

      const fileAlreadyExists = await fileExists(filePath)
      if (fileAlreadyExists) {
        await fs.promises.rm(filePath)
      }

      const fsPipe = fs.createWriteStream(filePath)
      dlPipe.pipe(fsPipe)

      await new Promise((resolve) => dlPipe.on('close', resolve))

      const { artists: trackArtists, title: trackTitle } = parseArtistTitle(scTrack.title)

      const metadata: Metadata = {
        title: trackTitle,
        artists: trackArtists ?? [scTrack.user.username],
        album: trackTitle,
        albumArtists: trackArtists ?? [scTrack.user.username],
        trackNumber: '1',
      }

      if (dbTrack.playlistDownloadId !== null) {
        const dbPlaylist = this.db.soundcloudPlaylistDownloads.get(dbTrack.playlistDownloadId)

        let scPlaylist = dbPlaylist.playlist
        if (!scPlaylist) {
          scPlaylist = await this.sc.getPlaylist(dbPlaylist.playlistId)
          this.db.soundcloudPlaylistDownloads.update(dbPlaylist.id, { playlist: scPlaylist })
        }

        const { artists: playlistArtists, title: playlistTitle } = parseArtistTitle(
          scPlaylist.title
        )

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const trackIndex = scPlaylist.tracks.findIndex((track) => track.id === scTrack!.id)

        metadata.album = playlistTitle
        metadata.albumArtists = playlistArtists ?? [scPlaylist.user.username]
        if (trackIndex !== -1) {
          metadata.trackNumber = `${trackIndex + 1}`
        }
      }

      await writeTrackMetadata(filePath, metadata)

      const artwork = await ifNotNull(scTrack.artwork_url, (artworkUrl) =>
        Soundcloud.getLargestAvailableImage(artworkUrl)
      )
      if (artwork) {
        await writeTrackCoverArt(filePath, artwork)
      }

      this.db.soundcloudTrackDownloads.update(task.dbId, { progress: 100 })
    }
  }
}
