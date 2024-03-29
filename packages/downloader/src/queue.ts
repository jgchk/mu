import { randomInt } from 'crypto'
import fastq from 'fastq'
import fs from 'fs'
import got from 'got'
import type { Metadata } from 'music-metadata'
import { parseArtistTitle, writeTrackCoverArt, writeTrackMetadata } from 'music-metadata'
import path from 'path'
import { Soundcloud } from 'soundcloud'
import type { SimplifiedAlbum as SpotifySimplifiedAlbum } from 'spotify'
import stream from 'stream'
import { ifNotNull, uniqBy } from 'utils'
import { ensureDir, fileExists } from 'utils/node'

import type { Context, Logger } from '.'

export type Task = SoundcloudTask | SpotifyTask

export type SoundcloudTask = {
  service: 'soundcloud'
  type: 'track' | 'playlist'
  dbId: number
}

export type SpotifyTask = {
  service: 'spotify'
  type: 'track' | 'album'
  dbId: number
}

export class DownloadQueue {
  private q: fastq.queueAsPromised<Task>
  private downloadDir: string
  private getContext: () => Context
  private logger: Logger

  constructor({
    getContext,
    downloadDir,
    logger,
    concurrency,
  }: {
    getContext: () => Context
    downloadDir: string
    logger: Logger
    concurrency: number
  }) {
    this.getContext = getContext
    this.downloadDir = downloadDir
    this.logger = logger

    this.q = fastq.promise(this.worker.bind(this), concurrency)
    this.q.error((err, task) => {
      if (err) {
        this.logger.error('Error processing task:', task, err)
      }
    })
  }

  setConcurrency(concurrency: number) {
    this.q.concurrency = concurrency
  }

  queue(task: Task) {
    return this.q.push(task)
  }

  close() {
    this.q.kill()
  }

  private async worker(task: Task) {
    if (task.service === 'soundcloud') {
      if (task.type === 'playlist') {
        await this.downloadSoundcloudPlaylist(task.dbId)
      } else if (task.type === 'track') {
        await this.downloadSoundcloudTrack(task.dbId)
      }
    } else if (task.service === 'spotify') {
      if (task.type === 'album') {
        await this.downloadSpotifyAlbum(task.dbId)
      } else if (task.type === 'track') {
        await this.downloadSpotifyTrack(task.dbId)
      }
    }
  }

  async downloadSoundcloudPlaylist(playlistId: number) {
    const { db, sc } = this.getContext()

    try {
      if (sc.status !== 'running') {
        throw new Error('Soundcloud is not running')
      }

      const dbPlaylist = db.soundcloudPlaylistDownloads.get(playlistId)

      if (dbPlaylist === undefined) {
        throw new Error(`Playlist with id ${playlistId} does not exist`)
      }

      let scPlaylist = dbPlaylist.playlist
      if (!scPlaylist) {
        scPlaylist = await sc.getPlaylist(dbPlaylist.playlistId)
        db.soundcloudPlaylistDownloads.update(playlistId, { playlist: scPlaylist })
      }

      const tracks = uniqBy(scPlaylist.tracks, (track) => track.id)

      const dbTracks = await Promise.all(
        tracks.map(async (track) => {
          const dbTrack =
            db.soundcloudTrackDownloads.getByTrackIdAndPlaylistDownloadId(
              track.id,
              dbPlaylist.id
            ) ??
            db.soundcloudTrackDownloads.insert({
              trackId: track.id,
              playlistDownloadId: dbPlaylist.id,
              status: 'pending',
            })

          let scTrack = dbTrack.track
          if (!scTrack) {
            scTrack = await sc.getTrack(dbTrack.trackId)
            db.soundcloudTrackDownloads.update(dbTrack.id, { track: scTrack })
          }

          return dbTrack
        })
      )

      for (const dbTrack of dbTracks) {
        void this.q.push({ service: 'soundcloud', type: 'track', dbId: dbTrack.id })
      }
    } catch (error) {
      db.soundcloudPlaylistDownloads.update(playlistId, { error })
    }
  }

  async downloadSoundcloudTrack(trackId: number): Promise<void> {
    const { db, sc } = this.getContext()

    try {
      if (sc.status !== 'running') {
        throw new Error('Soundcloud is not running')
      }

      const dbTrack = db.soundcloudTrackDownloads.get(trackId)

      if (dbTrack === undefined) {
        throw new Error(`Track with id ${trackId} does not exist`)
      }

      if (dbTrack.status === 'done') {
        return
      }

      let scTrack = dbTrack.track
      if (!scTrack) {
        scTrack = await sc.getTrack(dbTrack.trackId)
        db.soundcloudTrackDownloads.update(trackId, { track: scTrack })
      }

      db.soundcloudTrackDownloads.update(trackId, {
        status: 'downloading',
        progress: dbTrack.progress ?? 0,
      })

      let lastUpdate: Date | undefined = undefined
      const { pipe: dlPipe, extension } = await sc.downloadTrack(scTrack, {
        onProgress: ({ progress }) => {
          // update every second
          if (lastUpdate === undefined || Date.now() - lastUpdate.getTime() > 1000) {
            db.soundcloudTrackDownloads.update(trackId, { progress: Math.floor(progress * 100) })
            lastUpdate = new Date()
          }
        },
      })

      let filePath = dbTrack.path
      if (!filePath) {
        filePath = path.join(
          this.downloadDir,
          `sc-${scTrack.id}-${Date.now()}-${randomInt(0, 10)}.${extension}`
        )
        db.soundcloudTrackDownloads.update(trackId, { path: filePath })
      }

      await ensureDir(path.dirname(filePath))

      const fileAlreadyExists = await fileExists(filePath)
      if (fileAlreadyExists) {
        await fs.promises.rm(filePath)
      }

      const fsPipe = fs.createWriteStream(filePath)
      dlPipe.pipe(fsPipe)

      await stream.promises.finished(fsPipe)

      const { artists: trackArtists, title: trackTitle } = parseArtistTitle(scTrack.title)

      const metadata: Metadata = {
        title: trackTitle,
        artists: trackArtists ?? [scTrack.user.username],
        album: trackTitle,
        albumArtists: trackArtists ?? [scTrack.user.username],
        track: 1,
      }

      if (dbTrack.playlistDownloadId !== null) {
        const dbPlaylist = db.soundcloudPlaylistDownloads.get(dbTrack.playlistDownloadId)

        if (dbPlaylist === undefined) {
          throw new Error(`Playlist with id ${dbTrack.playlistDownloadId} does not exist`)
        }

        let scPlaylist = dbPlaylist.playlist
        if (!scPlaylist) {
          scPlaylist = await sc.getPlaylist(dbPlaylist.playlistId)
          db.soundcloudPlaylistDownloads.update(dbPlaylist.id, { playlist: scPlaylist })
        }

        const { artists: playlistArtists, title: playlistTitle } = parseArtistTitle(
          scPlaylist.title
        )

        metadata.album = playlistTitle
        metadata.albumArtists = playlistArtists ?? [scPlaylist.user.username]

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const trackIndex = scPlaylist.tracks.findIndex((track) => track.id === scTrack!.id)

        if (trackIndex !== -1) {
          metadata.track = trackIndex + 1
        }
      }

      await writeTrackMetadata(filePath, metadata)

      const artwork = await ifNotNull(scTrack.artwork_url, (artworkUrl) =>
        Soundcloud.getLargestAvailableImage(artworkUrl)
      )
      if (artwork) {
        await writeTrackCoverArt(filePath, artwork)
      }

      db.soundcloudTrackDownloads.update(trackId, { progress: 100, status: 'done' })
    } catch (error) {
      db.soundcloudTrackDownloads.update(trackId, { status: 'error', error })
    }
  }

  async downloadSpotifyAlbum(albumId: number) {
    const { db, sp } = this.getContext()

    try {
      if (sp.status !== 'running') {
        throw new Error('Spotify is not running')
      }
      if (!sp.webApi) {
        throw new Error('Spotify is not configured to use the Web API')
      }

      const dbAlbum = db.spotifyAlbumDownloads.get(albumId)

      if (dbAlbum === undefined) {
        throw new Error(`Album with id ${albumId} does not exist`)
      }

      let spotAlbum = dbAlbum.album
      if (!spotAlbum) {
        spotAlbum = await sp.getAlbum(dbAlbum.albumId)
        db.spotifyAlbumDownloads.update(albumId, { album: spotAlbum })
      }

      const tracks = await sp.getAlbumTracks(spotAlbum.id)

      const dbTracks = await Promise.all(
        tracks.map((track) => {
          const dbTrack =
            db.spotifyTrackDownloads.getByTrackIdAndAlbumDownloadId(track.id, dbAlbum.id) ??
            db.spotifyTrackDownloads.insert({
              trackId: track.id,
              albumDownloadId: dbAlbum.id,
              status: 'pending',
            })

          const spotTrack = dbTrack.track
          if (!spotTrack) {
            db.spotifyTrackDownloads.update(dbTrack.id, { track: track })
          }

          return dbTrack
        })
      )

      for (const dbTrack of dbTracks) {
        void this.q.push({ service: 'spotify', type: 'track', dbId: dbTrack.id })
      }
    } catch (error) {
      db.spotifyAlbumDownloads.update(albumId, { error })
    }
  }

  async downloadSpotifyTrack(trackId: number) {
    const { db, sp } = this.getContext()

    try {
      if (sp.status !== 'running') {
        throw new Error('Spotify is not running')
      }
      if (!sp.webApi) {
        throw new Error('Spotify is not configured to use the Web API')
      }
      if (!sp.downloads) {
        throw new Error('Spotify is not configured to download tracks')
      }

      const dbTrack = db.spotifyTrackDownloads.get(trackId)

      if (dbTrack === undefined) {
        throw new Error(`Track with id ${trackId} does not exist`)
      }

      if (dbTrack.status === 'done') {
        return
      }

      let spotTrack = dbTrack.track
      if (!spotTrack) {
        spotTrack = await sp.getTrack(dbTrack.trackId)
        db.spotifyTrackDownloads.update(trackId, { track: spotTrack })
      }

      db.spotifyTrackDownloads.update(trackId, {
        status: 'downloading',
        progress: dbTrack.progress ?? 0,
      })

      let filePath = dbTrack.path
      if (!filePath) {
        filePath = path.join(
          this.downloadDir,
          `spot-${spotTrack.id}-${Date.now()}-${randomInt(0, 10)}.ogg`
        )
        db.spotifyTrackDownloads.update(trackId, { path: filePath })
      }

      await fs.promises.mkdir(path.dirname(filePath), { recursive: true })

      const fileAlreadyExists = await fileExists(filePath)
      if (fileAlreadyExists) {
        await fs.promises.rm(filePath)
      }

      let lastUpdate: Date | undefined = undefined
      const fsPipe = fs.createWriteStream(filePath)
      const dlPipe = sp.downloadTrack(spotTrack.id, {
        onProgress: ({ progress }) => {
          // update every second
          if (lastUpdate === undefined || Date.now() - lastUpdate.getTime() > 1000) {
            db.spotifyTrackDownloads.update(trackId, { progress: Math.floor(progress * 100) })
            lastUpdate = new Date()
          }
        },
      })
      dlPipe.pipe(fsPipe)

      await stream.promises.finished(fsPipe)

      const isDownloadSize0 = await fs.promises.stat(filePath).then((stat) => stat.size === 0)
      if (isDownloadSize0) {
        throw new Error('Downloaded file is 0 bytes')
      }

      const metadata: Metadata = {
        title: spotTrack.name,
        artists: spotTrack.artists.map((artist) => artist.name),
        album: spotTrack.name,
        albumArtists: spotTrack.artists.map((artist) => artist.name),
        track: 1,
      }

      let spotAlbum: SpotifySimplifiedAlbum
      if (dbTrack.albumDownloadId !== null) {
        const dbAlbum = db.spotifyAlbumDownloads.get(dbTrack.albumDownloadId)

        if (dbAlbum === undefined) {
          throw new Error(`Album with id ${dbTrack.albumDownloadId} does not exist`)
        }

        let spotAlbum_ = dbAlbum.album
        if (!spotAlbum_) {
          spotAlbum_ = await sp.getAlbum(dbAlbum.albumId)
          db.spotifyAlbumDownloads.update(dbAlbum.id, { album: spotAlbum_ })
        }
        spotAlbum = spotAlbum_

        metadata.album = spotAlbum.name
        metadata.albumArtists = spotAlbum.artists.map((artist) => artist.name)
        metadata.track = spotTrack.track_number
      } else {
        const fullSpotTrack = await sp.getTrack(spotTrack.id)
        spotAlbum = fullSpotTrack.album
      }

      try {
        await writeTrackMetadata(filePath, metadata)
      } catch {
        // OGG Files sometimes fail the first time then work the second time
        await writeTrackMetadata(filePath, metadata)
      }

      const largestImage = spotAlbum.images
        .sort((a, b) => b.width * b.height - a.width * a.height)
        .at(0)
      if (largestImage) {
        const artwork = await got(largestImage.url).buffer()
        try {
          await writeTrackCoverArt(filePath, artwork)
        } catch {
          // OGG Files sometimes fail the first time then work the second time
          await writeTrackCoverArt(filePath, artwork)
        }
      }

      db.spotifyTrackDownloads.update(trackId, { progress: 100, status: 'done' })
    } catch (error) {
      db.spotifyTrackDownloads.update(trackId, { status: 'error', error })
    }
  }
}
