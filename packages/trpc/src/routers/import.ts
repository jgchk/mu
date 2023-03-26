import type { Database, SoulseekTrackDownload } from 'db'
import { fileTypeFromFile } from 'file-type'
import filenamify from 'filenamify'
import fs from 'fs/promises'
import type { Metadata } from 'music-metadata'
import { readTrackCoverArt, readTrackMetadata, writeTrackCoverArt } from 'music-metadata'
import path from 'path'
import { z } from 'zod'

import { publicProcedure, router } from '../trpc'
import { isDefined } from '../utils/types'

type Download = { id: number; progress: number | null; path: string | null }
type CompleteDownload = { id: number; progress: 100; path: string }

const isComplete = (dl: Download): dl is CompleteDownload => {
  return dl.progress === 100 && dl.path !== null
}

type SoulseekCompleteDownload = Omit<SoulseekTrackDownload, 'path'> & {
  path: NonNullable<SoulseekTrackDownload['path']>
}
const isSoulseekDownloadComplete = (dl: SoulseekTrackDownload): dl is SoulseekCompleteDownload => {
  return dl.path !== null
}

export const importRouter = router({
  groupDownload: publicProcedure
    .input(z.object({ service: z.enum(['soundcloud', 'spotify', 'soulseek']), id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      if (input.service === 'soulseek') {
        const releaseDownload = ctx.db.soulseekReleaseDownloads.get(input.id)
        const trackDownloads = ctx.db.soulseekTrackDownloads.getByReleaseDownloadId(
          releaseDownload.id
        )

        const completeDownloads = trackDownloads.filter(isSoulseekDownloadComplete)
        if (completeDownloads.length !== trackDownloads.length) {
          throw new Error('Not all downloads are complete')
        }

        const result = await importSoulseek(ctx.db, ctx.musicDir, completeDownloads)

        for (const trackDownload of trackDownloads) {
          const downloadWasIgnored = result.ignoredFiles.some(
            (ignoredFile) => ignoredFile.dbDownload.id === trackDownload.id
          )
          if (!downloadWasIgnored) {
            ctx.db.soulseekTrackDownloads.delete(trackDownload.id)
          }
        }
        if (result.ignoredFiles.length === 0) {
          ctx.db.soulseekReleaseDownloads.delete(releaseDownload.id)
        }

        return result
      }

      let download
      let trackDownloads: Download[]
      if (input.service === 'soundcloud') {
        download = ctx.db.soundcloudPlaylistDownloads.get(input.id)
        trackDownloads = ctx.db.soundcloudTrackDownloads.getByPlaylistDownloadId(download.id)
      } else if (input.service === 'spotify') {
        download = ctx.db.spotifyAlbumDownloads.get(input.id)
        trackDownloads = ctx.db.spotifyTrackDownloads.getByAlbumDownloadId(download.id)
      } else {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        throw new Error(`Invalid service: ${input.service}`)
      }

      const completeDownloads = trackDownloads.filter(isComplete)
      if (completeDownloads.length !== trackDownloads.length) {
        throw new Error('Not all downloads are complete')
      }

      const result = await importFiles(ctx.db, ctx.musicDir, completeDownloads)

      for (const trackDownload of trackDownloads) {
        const downloadWasIgnored = result.ignoredFiles.some(
          (ignoredFile) => ignoredFile.dbDownload.id === trackDownload.id
        )
        if (!downloadWasIgnored) {
          if (input.service === 'soundcloud') {
            ctx.db.soundcloudTrackDownloads.delete(trackDownload.id)
          } else if (input.service === 'spotify') {
            ctx.db.spotifyTrackDownloads.delete(trackDownload.id)
          }
        }
      }
      if (result.ignoredFiles.length === 0 && download) {
        if (input.service === 'soundcloud') {
          ctx.db.soundcloudPlaylistDownloads.delete(download.id)
        } else if (input.service === 'spotify') {
          ctx.db.spotifyAlbumDownloads.delete(download.id)
        }
      }

      return result
    }),
  trackDownload: publicProcedure
    .input(z.object({ service: z.enum(['soundcloud', 'spotify', 'soulseek']), id: z.number() }))
    .mutation(async ({ input: { service, id }, ctx }) => {
      let download: Download
      if (service === 'soundcloud') {
        download = ctx.db.soundcloudTrackDownloads.get(id)
      } else if (service === 'spotify') {
        download = ctx.db.spotifyTrackDownloads.get(id)
      } else if (service === 'soulseek') {
        download = ctx.db.soulseekTrackDownloads.get(id)
      } else {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        throw new Error(`Invalid service: ${service}`)
      }

      if (!isComplete(download)) {
        throw new Error('Download is not complete')
      }

      const result = await importFiles(ctx.db, ctx.musicDir, [download])

      const downloadWasIgnored = result.ignoredFiles.some(
        (ignoredFile) => ignoredFile.dbDownload.id === download.id
      )

      if (!downloadWasIgnored) {
        if (service === 'soundcloud') {
          ctx.db.soundcloudTrackDownloads.delete(download.id)
        } else if (service === 'spotify') {
          ctx.db.spotifyTrackDownloads.delete(download.id)
        } else if (service === 'soulseek') {
          ctx.db.soulseekTrackDownloads.delete(download.id)
        }
      }

      return result
    }),
})

const importSoulseek = async (
  db: Database,
  musicDir: string,
  dbDownloads: (Omit<SoulseekTrackDownload, 'path'> & {
    path: NonNullable<SoulseekTrackDownload['path']>
  })[]
) => {
  const downloads = await Promise.all(
    dbDownloads.map(async (dbDownload) => {
      const fileType = await fileTypeFromFile(dbDownload.path)
      return {
        dbDownload,
        fileType,
      }
    })
  )

  const audioDownloads = downloads.filter((download) =>
    download.fileType?.mime.startsWith('audio/')
  )
  const imageDownloads = downloads.filter((download) =>
    download.fileType?.mime.startsWith('image/')
  )

  const audioDownloadsWithMetadata = (
    await Promise.all(
      audioDownloads.map(async (download) => {
        const metadata = await readTrackMetadata(path.resolve(download.dbDownload.path))
        if (!metadata) return
        return {
          ...download,
          metadata,
        }
      })
    )
  ).filter(isDefined)

  const ignoredFiles = dbDownloads
    .filter(
      (dbDownload) =>
        !audioDownloadsWithMetadata.some((download) => download.dbDownload.id === dbDownload.id)
    )
    .map((dbDownload) => ({
      dbDownload,
      reason: 'Unsupported file type',
    }))

  const albumArtists = (
    audioDownloadsWithMetadata.find((download) => download.metadata.albumArtists.length > 0)
      ?.metadata.albumArtists ?? []
  ).map((name) => {
    const dbArtists = db.artists.getByName(name)
    if (dbArtists.length > 0) {
      return dbArtists[0]
    } else {
      return db.artists.insert({ name })
    }
  })
  const albumTitle =
    audioDownloadsWithMetadata.find((download) => download.metadata.album)?.metadata.album ?? null
  const albumCover = imageDownloads.find((download) => {
    const filename = path.parse(download.dbDownload.file.replaceAll('\\', '/')).name
    return filename === 'front' || filename === 'cover' || filename === 'folder'
  })

  const dbRelease = db.releases.insertWithArtists({
    title: albumTitle,
    artists: albumArtists.map((artist) => artist.id),
  })

  const dbTracks = await Promise.all(
    audioDownloadsWithMetadata.map(async (download) => {
      let filename = ''
      if (download.metadata.track !== null) {
        const numDigitsInTrackNumber = Math.ceil(Math.log10(audioDownloadsWithMetadata.length + 1))

        const trackIsAllDigits = /^\d+$/.test(download.metadata.track)
        if (trackIsAllDigits) {
          filename += download.metadata.track.padStart(numDigitsInTrackNumber, '0')
        } else {
          filename += download.metadata.track
        }
        filename += ' '
      }
      filename += download.metadata.title
      filename += path.extname(download.dbDownload.path)

      const newPath = path.join(
        musicDir,
        filenamify(download.metadata.albumArtists.join(', ')),
        filenamify(download.metadata.album || '[untitled]'),
        filenamify(filename)
      )

      if (path.resolve(download.dbDownload.path) !== path.resolve(newPath)) {
        await fs.mkdir(path.dirname(newPath), { recursive: true })
        await fs.rename(path.resolve(download.dbDownload.path), newPath)
      }

      let hasCoverArt = (await readTrackCoverArt(path.resolve(newPath))) !== undefined
      if (!hasCoverArt && albumCover) {
        const frontCoverBuffer = await fs.readFile(newPath)
        await writeTrackCoverArt(path.resolve(newPath), frontCoverBuffer)
        hasCoverArt = true
      }

      const artists = download.metadata.artists.map((name) => {
        const dbArtists = db.artists.getByName(name)
        if (dbArtists.length > 0) {
          return dbArtists[0]
        } else {
          return db.artists.insert({ name })
        }
      })

      const dbTrack = db.tracks.insertWithArtists({
        title: download.metadata.title,
        artists: artists.map((artist) => artist.id),
        path: newPath,
        releaseId: dbRelease.id,
        trackNumber: download.metadata.track,
        hasCoverArt: hasCoverArt,
      })

      return dbTrack
    })
  )

  return {
    dbRelease,
    dbTracks,
    ignoredFiles,
  }
}

const importFiles = async (db: Database, musicDir: string, dbDownloads: CompleteDownload[]) => {
  const filesDataRaw = await Promise.allSettled(
    dbDownloads.map(async (dbDownload) => {
      const metadata = await readTrackMetadata(path.resolve(dbDownload.path))

      if (!metadata) {
        throw new Error('No metadata available')
      }

      return {
        dbDownload,
        metadata,
      }
    })
  )

  const filesData = filesDataRaw
    .filter(
      (
        result
      ): result is PromiseFulfilledResult<{
        dbDownload: CompleteDownload
        metadata: Metadata
      }> => result.status === 'fulfilled'
    )
    .map((result) => result.value)

  const ignoredFiles = dbDownloads
    .map((dbDownload, i) => {
      const result = filesDataRaw[i]
      if (result.status === 'rejected') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        return { dbDownload, reason: result.reason }
      }
    })
    .filter(isDefined)

  const albumArtists = filesData[0].metadata.albumArtists.map((name) => {
    const matchingArtists = db.artists.getByName(name)
    if (matchingArtists.length > 0) {
      return matchingArtists[0]
    } else {
      return db.artists.insert({ name })
    }
  })

  const dbRelease = db.releases.insertWithArtists({
    title: filesData[0].metadata.album ?? filesData[0].metadata.title,
    artists: albumArtists.map((artist) => artist.id),
  })

  const dbTracks = await Promise.all(
    filesData.map(async ({ metadata, dbDownload }) => {
      const coverArt = await readTrackCoverArt(path.resolve(dbDownload.path))

      // convert artist names to artist ids
      // - if artist with name exists, use that
      // - if not, create new artist
      const artists = metadata.artists.map((name) => {
        const matchingArtists = db.artists.getByName(name)
        if (matchingArtists.length > 0) {
          return matchingArtists[0]
        } else {
          return db.artists.insert({ name })
        }
      })

      let filename = ''
      if (metadata.track !== null) {
        const numDigitsInTrackNumber = Math.ceil(Math.log10(filesData.length + 1))

        const trackIsAllDigits = /^\d+$/.test(metadata.track)
        if (trackIsAllDigits) {
          filename += metadata.track.padStart(numDigitsInTrackNumber, '0')
        } else {
          filename += metadata.track
        }
        filename += ' '
      }
      filename += metadata.title
      filename += path.extname(dbDownload.path)

      const newPath = path.join(
        musicDir,
        filenamify(metadata.albumArtists.join(', ')),
        filenamify(metadata.album || '[untitled]'),
        filenamify(filename)
      )

      const track = db.tracks.insertWithArtists({
        title: metadata.title,
        artists: artists.map((artist) => artist.id),
        path: newPath,
        releaseId: dbRelease.id,
        trackNumber: metadata.track,
        hasCoverArt: coverArt !== undefined,
      })

      if (path.resolve(dbDownload.path) !== path.resolve(newPath)) {
        await fs.mkdir(path.dirname(newPath), { recursive: true })
        await fs.rename(path.resolve(dbDownload.path), newPath)
      }

      return track
    })
  )

  return {
    release: dbRelease,
    tracks: dbTracks,
    ignoredFiles,
  }
}
