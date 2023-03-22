import type { Database } from 'db'
import filenamify from 'filenamify'
import fs from 'fs/promises'
import { readTrackCoverArt, readTrackMetadata } from 'music-metadata'
import path from 'path'
import { z } from 'zod'

import { publicProcedure, router } from '../trpc'

export const importRouter = router({
  groupDownload: publicProcedure
    .input(
      z
        .object({ service: z.enum(['soundcloud', 'spotify']), id: z.number() })
        .or(z.object({ service: z.literal('soulseek'), ids: z.number().array() }))
    )
    .mutation(async ({ input, ctx }) => {
      let download
      let trackDownloads: { id: number; progress: number | null; path: string | null }[]
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

      const allTrackDownloadsComplete = trackDownloads.every(
        (download) => download.progress === 100
      )
      if (!allTrackDownloadsComplete) {
        throw new Error('Not all downloads are complete')
      }

      const allTrackDownloadsHavePaths = trackDownloads.every((download) => download.path)
      if (!allTrackDownloadsHavePaths) {
        throw new Error('Not all downloads have paths')
      }

      const tracks = await importFiles(
        ctx.db,
        ctx.musicDir,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        trackDownloads.map((download) => download.path!)
      )

      if (input.service === 'soundcloud') {
        trackDownloads.forEach((download) => ctx.db.soundcloudTrackDownloads.delete(download.id))
        if (download) {
          ctx.db.soundcloudPlaylistDownloads.delete(download.id)
        }
      } else if (input.service === 'spotify') {
        trackDownloads.forEach((download) => ctx.db.spotifyTrackDownloads.delete(download.id))
        if (download) {
          ctx.db.spotifyAlbumDownloads.delete(download.id)
        }
      } else if (input.service === 'soulseek') {
        trackDownloads.forEach((download) => ctx.db.soulseekTrackDownloads.delete(download.id))
      }

      return tracks
    }),
  trackDownload: publicProcedure
    .input(z.object({ service: z.enum(['soundcloud', 'spotify', 'soulseek']), id: z.number() }))
    .mutation(async ({ input: { service, id }, ctx }) => {
      let download
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

      if (download.progress !== 100) {
        throw new Error('Download is not complete')
      }
      if (!download.path) {
        throw new Error('Download has no path')
      }

      const track = await importFiles(ctx.db, ctx.musicDir, [download.path])

      if (service === 'soundcloud') {
        ctx.db.soundcloudTrackDownloads.delete(download.id)
      } else if (service === 'spotify') {
        ctx.db.spotifyTrackDownloads.delete(download.id)
      } else if (service === 'soulseek') {
        ctx.db.soulseekTrackDownloads.delete(download.id)
      }

      return track
    }),
})

const importFiles = async (db: Database, musicDir: string, filePaths: string[]) => {
  const trackData = await Promise.all(
    filePaths.map(async (filePath) => {
      const metadata = await readTrackMetadata(filePath)

      if (!metadata) {
        throw new Error('No metadata available')
      }

      return {
        filePath,
        metadata,
      }
    })
  )

  const albumArtists = trackData[0].metadata.albumArtists.map((name) => {
    const matchingArtists = db.artists.getByName(name)
    if (matchingArtists.length > 0) {
      return matchingArtists[0]
    } else {
      return db.artists.insert({ name })
    }
  })

  const dbRelease = db.releases.insertWithArtists({
    title: trackData[0].metadata.album ?? trackData[0].metadata.title,
    artists: albumArtists.map((artist) => artist.id),
  })

  const dbTracks = await Promise.all(
    trackData.map(async ({ metadata, filePath }) => {
      const coverArt = await readTrackCoverArt(filePath)

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
        const numDigitsInTrackNumber = Math.ceil(Math.log10(trackData.length + 1))

        const trackIsAllDigits = /^\d+$/.test(metadata.track)
        if (trackIsAllDigits) {
          filename += metadata.track.padStart(numDigitsInTrackNumber, '0')
        } else {
          filename += metadata.track
        }
        filename += ' '
      }
      filename += metadata.title
      filename += path.extname(filePath)

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

      if (filePath !== newPath) {
        await fs.mkdir(path.dirname(newPath), { recursive: true })
        await fs.rename(filePath, newPath)
      }

      return track
    })
  )

  return {
    release: dbRelease,
    tracks: dbTracks,
  }
}
