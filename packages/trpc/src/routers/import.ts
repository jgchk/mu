import type { Database, SoulseekTrackDownload } from 'db'
import { fileTypeFromFile } from 'file-type'
import filenamify from 'filenamify'
import fs from 'fs/promises'
import type { Metadata } from 'music-metadata'
import {
  readTrackCoverArt,
  readTrackMetadata,
  writeTrackCoverArt,
  writeTrackMetadata,
} from 'music-metadata'
import path from 'path'
import { z } from 'zod'

import { publicProcedure, router } from '../trpc'
import { isDefined } from '../utils/types'

type Download = { id: number; progress: number | null; path: string | null }
type CompleteDownload = { id: number; progress: 100; path: string }

const isComplete = (dl: Download): dl is CompleteDownload => {
  return dl.progress === 100 && dl.path !== null
}

type Complete<T extends { path: string | null }> = Omit<T, 'path'> & {
  path: NonNullable<T['path']>
}
const isDownloadComplete = <T extends { path: string | null }>(
  dl: T | Complete<T>
): dl is Complete<T> => {
  return dl.path !== null
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
  groupDownloadData: publicProcedure
    .input(z.object({ service: z.enum(['soundcloud', 'spotify', 'soulseek']), id: z.number() }))
    .query(async ({ input, ctx }) => {
      let releaseDownload
      let trackDownloads
      let completeDownloads

      if (input.service === 'soulseek') {
        releaseDownload = ctx.db.soulseekReleaseDownloads.get(input.id)
        trackDownloads = ctx.db.soulseekTrackDownloads.getByReleaseDownloadId(releaseDownload.id)
        completeDownloads = trackDownloads.filter(isDownloadComplete)
      } else if (input.service === 'soundcloud') {
        releaseDownload = ctx.db.soundcloudPlaylistDownloads.get(input.id)
        trackDownloads = ctx.db.soundcloudTrackDownloads.getByPlaylistDownloadId(releaseDownload.id)
        completeDownloads = trackDownloads.filter(isDownloadComplete)
      } else if (input.service === 'spotify') {
        releaseDownload = ctx.db.spotifyAlbumDownloads.get(input.id)
        trackDownloads = ctx.db.spotifyTrackDownloads.getByAlbumDownloadId(releaseDownload.id)
        completeDownloads = trackDownloads.filter(isDownloadComplete)
      } else {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        throw new Error(`Invalid service: ${input.service}`)
      }

      if (completeDownloads.length !== trackDownloads.length) {
        throw new Error('Not all downloads are complete')
      }

      const downloads = await Promise.all(
        completeDownloads.map(async (dbDownload) => {
          const fileType = await fileTypeFromFile(dbDownload.path)
          return {
            dbDownload,
            fileType,
          }
        })
      )

      const audioDownloads = downloads.filter(
        (download) =>
          download.fileType?.mime.startsWith('audio/') || download.fileType?.mime === 'video/mp4'
      )

      const tracks = await Promise.all(
        audioDownloads.map(async (download) => {
          const metadata = await readTrackMetadata(path.resolve(download.dbDownload.path))
          if (!metadata) {
            throw new Error('Could not read metadata')
          }
          return {
            id: download.dbDownload.id,
            metadata,
          }
        })
      )

      const albumArtists =
        tracks.find((track) => track.metadata && track.metadata.albumArtists.length > 0)?.metadata
          ?.albumArtists ?? []
      const albumTitle =
        tracks.find((track) => track.metadata && track.metadata.album)?.metadata?.album ?? null

      return {
        album: {
          title: albumTitle,
          artists: albumArtists,
        },
        tracks: tracks.map((track) => ({
          id: track.id,
          metadata: track.metadata,
        })),
      }
    }),
  groupDownloadManual: publicProcedure
    .input(
      z.object({
        service: z.enum(['soundcloud', 'spotify', 'soulseek']),
        id: z.number(),
        artists: z.map(z.number(), z.string()),
        album: z.object({
          title: z.string().optional(),
          artists: z
            .union([
              z.object({ action: z.literal('connect'), id: z.number() }),
              z.object({ action: z.literal('create'), id: z.number() }),
            ])
            .array(),
        }),
        tracks: z
          .object({
            id: z.number(),
            title: z.string().optional(),
            artists: z
              .union([
                z.object({ action: z.literal('connect'), id: z.number() }),
                z.object({ action: z.literal('create'), id: z.number() }),
              ])
              .array(),
            track: z.number().optional(),
          })
          .array(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      let releaseDownload
      let trackDownloads
      let completeDownloads
      if (input.service === 'soulseek') {
        releaseDownload = ctx.db.soulseekReleaseDownloads.get(input.id)
        trackDownloads = ctx.db.soulseekTrackDownloads.getByReleaseDownloadId(releaseDownload.id)
        completeDownloads = trackDownloads.filter(isDownloadComplete)
      } else if (input.service === 'soundcloud') {
        releaseDownload = ctx.db.soundcloudPlaylistDownloads.get(input.id)
        trackDownloads = ctx.db.soundcloudTrackDownloads.getByPlaylistDownloadId(releaseDownload.id)
        completeDownloads = trackDownloads.filter(isDownloadComplete)
      } else if (input.service === 'spotify') {
        releaseDownload = ctx.db.spotifyAlbumDownloads.get(input.id)
        trackDownloads = ctx.db.spotifyTrackDownloads.getByAlbumDownloadId(releaseDownload.id)
        completeDownloads = trackDownloads.filter(isDownloadComplete)
      } else {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        throw new Error(`Invalid service: ${input.service}`)
      }

      if (completeDownloads.length !== trackDownloads.length) {
        throw new Error('Not all downloads are complete')
      }

      const downloads = completeDownloads.map((download) => {
        const track = input.tracks.find((track) => track.id === download.id)
        if (!track) {
          throw new Error('Track not found')
        }
        return {
          dbDownload: download,
          metadata: track,
        }
      })

      const artistMap = new Map(
        [...input.artists.entries()].map(([id, name]) => [id, ctx.db.artists.insert({ name })])
      )

      const albumTitle = input.album.title
      const albumArtists = input.album.artists.map((artist) => {
        if (artist.action === 'create') {
          const dbArtist = artistMap.get(artist.id)
          if (!dbArtist) {
            throw new Error(`Artist ${artist.id} missing from input.artists`)
          }
          return dbArtist
        } else {
          return ctx.db.artists.get(artist.id)
        }
      })
      const dbRelease = ctx.db.releases.insertWithArtists({
        title: albumTitle,
        artists: albumArtists.map((artist) => artist.id),
      })

      const dbTracks = await Promise.all(
        downloads.map(async (download) => {
          let filename = ''
          if (download.metadata.track !== undefined) {
            const numDigitsInTrackNumber = Math.ceil(Math.log10(downloads.length + 1))
            filename += download.metadata.track.toString().padStart(numDigitsInTrackNumber, '0')
            filename += ' '
          }
          filename += download.metadata.title ?? '[untitled]'
          filename += path.extname(download.dbDownload.path)

          const newPath = path.join(
            ctx.musicDir,
            filenamify(
              albumArtists.length > 0
                ? albumArtists.map((artist) => artist.name).join(', ')
                : '[unknown]'
            ),
            filenamify(albumTitle || '[untitled]'),
            filenamify(filename)
          )

          if (path.resolve(download.dbDownload.path) !== path.resolve(newPath)) {
            await fs.mkdir(path.dirname(newPath), { recursive: true })
            await fs.rename(path.resolve(download.dbDownload.path), newPath)
          }

          const artists = download.metadata.artists.map((artist) => {
            if (artist.action === 'create') {
              const dbArtist = artistMap.get(artist.id)
              if (!dbArtist) {
                throw new Error(`Artist ${artist.id} missing from input.artists`)
              }
              return dbArtist
            } else {
              return ctx.db.artists.get(artist.id)
            }
          })
          const metadata: Metadata = {
            title: download.metadata.title ?? null,
            artists: artists.map((artist) => artist.name),
            track: download.metadata.track ?? null,
            album: albumTitle ?? null,
            albumArtists: albumArtists.map((artist) => artist.name),
          }
          await writeTrackMetadata(path.resolve(newPath), metadata)

          const dbTrack = ctx.db.tracks.insertWithArtists({
            title: metadata.title,
            artists: artists.map((artist) => artist.id),
            path: newPath,
            releaseId: dbRelease.id,
            trackNumber: metadata.track,
            hasCoverArt: false,
          })

          if (input.service === 'soulseek') {
            ctx.db.soulseekTrackDownloads.delete(download.dbDownload.id)
          } else if (input.service === 'soundcloud') {
            ctx.db.soundcloudTrackDownloads.delete(download.dbDownload.id)
          } else if (input.service === 'spotify') {
            ctx.db.spotifyTrackDownloads.delete(download.dbDownload.id)
          } else {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            throw new Error(`Invalid service: ${input.service}`)
          }

          return dbTrack
        })
      )

      if (trackDownloads.length === downloads.length) {
        if (input.service === 'soulseek') {
          ctx.db.soulseekReleaseDownloads.delete(releaseDownload.id)
        } else if (input.service === 'soundcloud') {
          ctx.db.soundcloudPlaylistDownloads.delete(releaseDownload.id)
        } else if (input.service === 'spotify') {
          ctx.db.spotifyAlbumDownloads.delete(releaseDownload.id)
        } else {
          // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
          throw new Error(`Invalid service: ${input.service}`)
        }
      }

      return {
        release: dbRelease,
        tracks: dbTracks,
      }
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
  trackDownloadData: publicProcedure
    .input(z.object({ service: z.enum(['soundcloud', 'spotify', 'soulseek']), id: z.number() }))
    .query(async ({ input: { service, id }, ctx }) => {
      let dbDownload
      if (service === 'soulseek') {
        dbDownload = ctx.db.soulseekTrackDownloads.get(id)
      } else if (service === 'soundcloud') {
        dbDownload = ctx.db.soundcloudTrackDownloads.get(id)
      } else if (service === 'spotify') {
        dbDownload = ctx.db.spotifyTrackDownloads.get(id)
      } else {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        throw new Error(`Invalid service: ${service}`)
      }

      if (!isDownloadComplete(dbDownload)) {
        throw new Error('Download is not complete')
      }

      const fileType = await fileTypeFromFile(dbDownload.path)

      if (!fileType?.mime.startsWith('audio/') && fileType?.mime !== 'video/mp4') {
        throw new Error('File is not audio')
      }

      const metadata = await readTrackMetadata(path.resolve(dbDownload.path))
      if (!metadata) {
        throw new Error('Could not read metadata')
      }

      return {
        id: dbDownload.id,
        metadata,
      }
    }),
  trackDownloadManual: publicProcedure
    .input(
      z.object({
        service: z.enum(['soundcloud', 'spotify', 'soulseek']),
        id: z.number(),
        createArtists: z.map(z.number(), z.string()),
        title: z.string().min(1).optional(),
        artists: z.object({ action: z.enum(['create', 'connect']), id: z.number() }).array(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      let dbDownload
      if (input.service === 'soulseek') {
        dbDownload = ctx.db.soulseekTrackDownloads.get(input.id)
      } else if (input.service === 'soundcloud') {
        dbDownload = ctx.db.soundcloudTrackDownloads.get(input.id)
      } else if (input.service === 'spotify') {
        dbDownload = ctx.db.spotifyTrackDownloads.get(input.id)
      } else {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        throw new Error(`Invalid service: ${input.service}`)
      }

      if (!isDownloadComplete(dbDownload)) {
        throw new Error('Download is not complete')
      }

      const artistMap = new Map(
        [...input.createArtists.entries()].map(([id, name]) => [
          id,
          ctx.db.artists.insert({ name }),
        ])
      )

      const artists = input.artists.map((artist) => {
        if (artist.action === 'create') {
          const dbArtist = artistMap.get(artist.id)
          if (!dbArtist) {
            throw new Error(`Artist ${artist.id} missing from input.createArtists`)
          }
          return dbArtist
        } else {
          return ctx.db.artists.get(artist.id)
        }
      })
      const dbRelease = ctx.db.releases.insertWithArtists({
        title: input.title,
        artists: artists.map((artist) => artist.id),
      })

      // track
      const filename = `1 ${input.title ?? '[untitled]'}${path.extname(dbDownload.path)}`

      const newPath = path.join(
        ctx.musicDir,
        filenamify(
          artists.length > 0 ? artists.map((artist) => artist.name).join(', ') : '[unknown]'
        ),
        filenamify(input.title ?? '[unknown]'),
        filenamify(filename)
      )

      if (path.resolve(dbDownload.path) !== path.resolve(newPath)) {
        await fs.mkdir(path.dirname(newPath), { recursive: true })
        await fs.rename(path.resolve(dbDownload.path), newPath)
      }

      const metadata: Metadata = {
        title: input.title ?? null,
        artists: artists.map((artist) => artist.name),
        track: 1,
        album: input.title ?? null,
        albumArtists: artists.map((artist) => artist.name),
      }
      await writeTrackMetadata(path.resolve(newPath), metadata)

      const dbTrack = ctx.db.tracks.insertWithArtists({
        title: metadata.title,
        artists: artists.map((artist) => artist.id),
        path: newPath,
        releaseId: dbRelease.id,
        trackNumber: metadata.track,
        hasCoverArt: false,
      })

      if (input.service === 'soulseek') {
        ctx.db.soulseekTrackDownloads.delete(dbDownload.id)
      } else if (input.service === 'soundcloud') {
        ctx.db.soundcloudTrackDownloads.delete(dbDownload.id)
      } else if (input.service === 'spotify') {
        ctx.db.spotifyTrackDownloads.delete(dbDownload.id)
      } else {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        throw new Error(`Invalid service: ${input.service}`)
      }

      return {
        release: dbRelease,
        track: dbTrack,
      }
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
        filename += download.metadata.track.toString().padStart(numDigitsInTrackNumber, '0')
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
        filename += metadata.track.toString().padStart(numDigitsInTrackNumber, '0')
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
