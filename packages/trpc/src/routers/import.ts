import type { Database } from 'db'
import filenamify from 'filenamify'
import fs from 'fs/promises'
import type { Metadata } from 'music-metadata'
import { readTrackCoverArt, readTrackMetadata } from 'music-metadata'
import path from 'path'
import { z } from 'zod'

import { publicProcedure, router } from '../trpc'
import { isDefined } from '../utils/types'

type Download = { id: number; progress: number | null; path: string | null }
type CompleteDownload = { id: number; progress: 100; path: string }

const isComplete = (dl: Download): dl is CompleteDownload => {
  return dl.progress === 100 && dl.path !== null
}

export const importRouter = router({
  groupDownload: publicProcedure
    .input(
      z
        .object({ service: z.enum(['soundcloud', 'spotify']), id: z.number() })
        .or(z.object({ service: z.literal('soulseek'), ids: z.number().array() }))
    )
    .mutation(async ({ input, ctx }) => {
      let download
      let trackDownloads: Download[]
      if (input.service === 'soundcloud') {
        download = ctx.db.soundcloudPlaylistDownloads.get(input.id)
        trackDownloads = ctx.db.soundcloudTrackDownloads.getByPlaylistDownloadId(download.id)
      } else if (input.service === 'spotify') {
        download = ctx.db.spotifyAlbumDownloads.get(input.id)
        trackDownloads = ctx.db.spotifyTrackDownloads.getByAlbumDownloadId(download.id)
      } else if (input.service === 'soulseek') {
        trackDownloads = input.ids.map((id) => ctx.db.soulseekTrackDownloads.get(id))
      } else {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        throw new Error(`Invalid service: ${input.service}`)
      }

      const completeDownloads = trackDownloads.filter(isComplete)
      if (completeDownloads.length !== trackDownloads.length) {
        throw new Error('Not all downloads are complete')
      }

      const result = await importFiles(ctx.db, ctx.musicDir, completeDownloads)

      trackDownloads.forEach((download) => {
        const downloadWasIgnored = result.ignoredFiles.some(
          (ignoredFile) => ignoredFile.dbDownload.id === download.id
        )
        if (!downloadWasIgnored) {
          if (input.service === 'soundcloud') {
            ctx.db.soundcloudTrackDownloads.delete(download.id)
          } else if (input.service === 'spotify') {
            ctx.db.spotifyTrackDownloads.delete(download.id)
          } else if (input.service === 'soulseek') {
            ctx.db.soulseekTrackDownloads.delete(download.id)
          }
        }
      })
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
