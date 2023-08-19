import { TRPCError } from '@trpc/server'
import { artists } from 'db'
import { env } from 'env'
import { fileTypeFromFile } from 'file-type'
import filenamify from 'filenamify'
import fs from 'fs/promises'
import type { Metadata } from 'music-metadata'
import { readTrackMetadata, writeTrackCoverArt, writeTrackMetadata } from 'music-metadata'
import path from 'path'
import type { DistributiveOmit } from 'utils'
import { ifDefined, isAudio, isDefined, numDigits } from 'utils'
import { ensureDir } from 'utils/node'
import { z } from 'zod'

import { protectedProcedure, router } from '../trpc'

type Complete<T extends { path: string | null }> = DistributiveOmit<T, 'path'> & {
  path: NonNullable<T['path']>
}
const isDownloadComplete = <T extends { path: string | null }>(
  dl: T | Complete<T>
): dl is Complete<T> => {
  return dl.path !== null
}

export const importRouter = router({
  groupDownloadData: protectedProcedure
    .input(z.object({ service: z.enum(['soundcloud', 'spotify', 'soulseek']), id: z.number() }))
    .query(async ({ input, ctx }) => {
      const releaseDownload = ctx.sys().db.downloads.getGroupDownload(input.service, input.id)

      if (releaseDownload === undefined) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Group download not found',
        })
      }

      const trackDownloads = ctx
        .sys()
        .db.downloads.getGroupTrackDownloads(input.service, releaseDownload.id)
      const completeDownloads = trackDownloads.filter(isDownloadComplete)

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
        (download) => ifDefined(download.fileType?.mime, isAudio) ?? false
      )

      const tracks = await Promise.all(
        audioDownloads.map(async (download) => {
          const metadata = await readTrackMetadata(download.dbDownload.path)
          if (!metadata) {
            throw new Error('Could not read metadata')
          }
          return {
            id: download.dbDownload.id,
            path: download.dbDownload.path,
            metadata,
          }
        })
      )

      const albumArtists =
        tracks.find((track) => track.metadata && track.metadata.albumArtists.length > 0)?.metadata
          ?.albumArtists ?? []
      const albumTitle =
        tracks.find((track) => track.metadata && track.metadata.album)?.metadata?.album ?? null

      const createArtists: Map<number, string> = new Map()
      const artistMap: Map<string, { action: 'create' | 'connect'; id: number }> = new Map()

      const getArtist = (name: string) => {
        const artist = artistMap.get(name)

        if (artist) {
          return artist
        } else {
          const dbArtist = ctx.sys().db.artists.getByNameCaseInsensitive(name).at(0)
          if (dbArtist) {
            const artist = { action: 'connect', id: dbArtist.id } as const
            artistMap.set(name, artist)
            return artist
          } else {
            const id = createArtists.size + 1
            createArtists.set(id, name)

            const artist = { action: 'create', id } as const
            artistMap.set(name, artist)
            return artist
          }
        }
      }

      return {
        createArtists,
        album: {
          title: albumTitle ?? undefined,
          artists: albumArtists.map(getArtist),
        },
        tracks: tracks
          .sort((a, b) => (a.metadata.track ?? Infinity) - (b.metadata.track ?? Infinity))
          .map((track) => ({
            id: track.id,
            title: track.metadata.title ?? undefined,
            artists: track.metadata.artists.map(getArtist),
          })),
      }
    }),

  groupDownloadManual: protectedProcedure
    .input(
      z.object({
        service: z.enum(['soundcloud', 'spotify', 'soulseek']),
        id: z.number(),
        createArtists: z.map(z.number(), z.string()),
        album: z.object({
          title: z.string().optional(),
          artists: z.object({ action: z.enum(['create', 'connect']), id: z.number() }).array(),
          art: z.string().optional(),
        }),
        tracks: z
          .object({
            id: z.number(),
            title: z.string().optional(),
            artists: z.object({ action: z.enum(['create', 'connect']), id: z.number() }).array(),
          })
          .array(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const releaseDownload = ctx.sys().db.downloads.getGroupDownload(input.service, input.id)

      if (releaseDownload === undefined) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Group download not found',
        })
      }

      const trackDownloads = ctx
        .sys()
        .db.downloads.getGroupTrackDownloads(input.service, releaseDownload.id)

      const completeDownloads = trackDownloads.filter(isDownloadComplete)
      if (completeDownloads.length !== trackDownloads.length) {
        throw new Error('Not all downloads are complete')
      }

      const downloads = input.tracks.map((track) => {
        const dbDownload = completeDownloads.find((download) => download.id === track.id)
        if (!dbDownload) {
          throw new Error(`Download not found: ${track.id}`)
        }
        return {
          dbDownload,
          metadata: track,
        }
      })

      const artistMap = new Map(
        [...input.createArtists.entries()].map(([id, name]) => [
          id,
          ctx.sys().db.db.insert(artists).values({ name }).returning().get(),
        ])
      )

      const albumTitle = input.album.title
      const albumArtists = input.album.artists
        .map((artist) => {
          if (artist.action === 'create') {
            const dbArtist = artistMap.get(artist.id)
            if (!dbArtist) {
              throw new Error(`Artist ${artist.id} missing from input.artists`)
            }
            return dbArtist
          } else {
            return ctx.sys().db.artists.get(artist.id)
          }
        })
        .filter(isDefined)
      const dbRelease = ctx.sys().db.releases.insert({
        title: albumTitle,
      })
      ctx.sys().db.releaseArtists.insertManyByReleaseId(
        dbRelease.id,
        albumArtists.map((a) => a.id)
      )

      const dbTracks = await Promise.all(
        downloads.map(async (download, i) => {
          const trackNumber = i + 1

          let filename = ''
          const numDigitsInTrackNumber = numDigits(downloads.length)
          filename += trackNumber.toString().padStart(numDigitsInTrackNumber, '0')
          filename += ' '
          filename += download.metadata.title ?? '[untitled]'
          filename += path.extname(download.dbDownload.path)

          const newPath = path.resolve(
            path.join(
              env.MUSIC_DIR,
              filenamify(
                albumArtists.length > 0
                  ? albumArtists.map((artist) => artist.name).join(', ')
                  : '[unknown]'
              ),
              filenamify(albumTitle || '[untitled]'),
              filenamify(filename)
            )
          )

          if (path.resolve(download.dbDownload.path) !== newPath) {
            await ensureDir(path.dirname(newPath))
            await fs.rename(download.dbDownload.path, newPath)
          }

          const artists = download.metadata.artists
            .map((artist) => {
              if (artist.action === 'create') {
                const dbArtist = artistMap.get(artist.id)
                if (!dbArtist) {
                  throw new Error(`Artist ${artist.id} missing from input.artists`)
                }
                return dbArtist
              } else {
                return ctx.sys().db.artists.get(artist.id)
              }
            })
            .filter(isDefined)

          const metadata: Metadata = {
            title: download.metadata.title ?? null,
            artists: artists.map((artist) => artist.name),
            track: trackNumber,
            album: albumTitle ?? null,
            albumArtists: albumArtists.map((artist) => artist.name),
          }
          const outputMetadata = await writeTrackMetadata(newPath, metadata)

          let imageId: number | null = null
          const albumArt = input.album.art ? Buffer.from(input.album.art, 'base64') : null
          if (albumArt) {
            imageId = (await ctx.sys().img.getImage(albumArt)).id

            try {
              await writeTrackCoverArt(newPath, albumArt)
            } catch {
              // OGG Files sometimes fail the first time then work the second time
              await writeTrackCoverArt(newPath, albumArt)
            }
          }

          let favorite = false
          const lfm = ctx.sys().lfm
          if (lfm.status === 'logged-in' && metadata.title !== null && artists.length > 0) {
            favorite = await lfm.getLovedTrack({
              track: metadata.title,
              artist: artists.map((artist) => artist.name).join(', '),
            })
          }

          const dbTrack = ctx.sys().db.tracks.insert({
            title: metadata.title,
            path: newPath,
            releaseId: dbRelease.id,
            order: i,
            imageId,
            duration: outputMetadata.length,
            favorite,
          })
          const dbTrackArtists = ctx.sys().db.trackArtists.insertManyByTrackId(
            dbTrack.id,
            artists.map((a) => a.id)
          )

          ctx.sys().db.downloads.deleteTrackDownload(input.service, download.dbDownload.id)

          return { track: dbTrack, artists: dbTrackArtists }
        })
      )

      if (trackDownloads.length === downloads.length) {
        ctx.sys().db.downloads.deleteGroupDownload(input.service, releaseDownload.id)
      }

      return {
        release: dbRelease,
        tracks: dbTracks,
      }
    }),

  trackDownloadData: protectedProcedure
    .input(z.object({ service: z.enum(['soundcloud', 'spotify', 'soulseek']), id: z.number() }))
    .query(async ({ input, ctx }) => {
      const dbDownload = ctx.sys().db.downloads.getTrackDownload(input.service, input.id)

      if (dbDownload === undefined) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Track download not found',
        })
      }

      if (!isDownloadComplete(dbDownload)) {
        throw new Error('Download is not complete')
      }

      const fileType = await fileTypeFromFile(dbDownload.path)

      if (!fileType?.mime.startsWith('audio/') && fileType?.mime !== 'video/mp4') {
        throw new Error('File is not audio')
      }

      const metadata = await readTrackMetadata(dbDownload.path)
      if (!metadata) {
        throw new Error('Could not read metadata')
      }

      const createArtists: Map<number, string> = new Map()
      const artistMap: Map<string, { action: 'create' | 'connect'; id: number }> = new Map()

      const getArtist = (name: string) => {
        const artist = artistMap.get(name)

        if (artist) {
          return artist
        } else {
          const dbArtist = ctx.sys().db.artists.getByNameCaseInsensitive(name).at(0)
          if (dbArtist) {
            const artist = { action: 'connect', id: dbArtist.id } as const
            artistMap.set(name, artist)
            return artist
          } else {
            const id = createArtists.size + 1
            createArtists.set(id, name)

            const artist = { action: 'create', id } as const
            artistMap.set(name, artist)
            return artist
          }
        }
      }

      return {
        id: dbDownload.id,
        createArtists,
        title: metadata.title ?? undefined,
        artists: metadata.artists.map(getArtist),
      }
    }),

  trackDownloadManual: protectedProcedure
    .input(
      z.object({
        service: z.enum(['soundcloud', 'spotify', 'soulseek']),
        id: z.number(),
        createArtists: z.map(z.number(), z.string()),
        album: z.object({
          title: z.string().optional(),
          artists: z.object({ action: z.enum(['create', 'connect']), id: z.number() }).array(),
          art: z.string().optional(),
        }),
        track: z.object({
          title: z.string().min(1).optional(),
          artists: z.object({ action: z.enum(['create', 'connect']), id: z.number() }).array(),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const dbDownload = ctx.sys().db.downloads.getTrackDownload(input.service, input.id)

      if (dbDownload === undefined) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Track download not found',
        })
      }

      if (!isDownloadComplete(dbDownload)) {
        throw new Error('Download is not complete')
      }

      const artistMap = new Map(
        [...input.createArtists.entries()].map(([id, name]) => [
          id,
          ctx.sys().db.db.insert(artists).values({ name }).returning().get(),
        ])
      )

      const albumArtists = input.album.artists
        .map((artist) => {
          if (artist.action === 'create') {
            const dbArtist = artistMap.get(artist.id)
            if (!dbArtist) {
              throw new Error(`Artist ${artist.id} missing from input.createArtists`)
            }
            return dbArtist
          } else {
            return ctx.sys().db.artists.get(artist.id)
          }
        })
        .filter(isDefined)
      const trackArtists = input.track.artists
        .map((artist) => {
          if (artist.action === 'create') {
            const dbArtist = artistMap.get(artist.id)
            if (!dbArtist) {
              throw new Error(`Artist ${artist.id} missing from input.createArtists`)
            }
            return dbArtist
          } else {
            return ctx.sys().db.artists.get(artist.id)
          }
        })
        .filter(isDefined)

      const dbRelease = ctx.sys().db.releases.insert({
        title: input.album.title,
      })
      ctx.sys().db.releaseArtists.insertManyByReleaseId(
        dbRelease.id,
        albumArtists.map((a) => a.id)
      )

      // track
      const filename = `1 ${input.track.title ?? '[untitled]'}${path.extname(dbDownload.path)}`

      const newPath = path.resolve(
        path.join(
          env.MUSIC_DIR,
          filenamify(
            albumArtists.length > 0
              ? albumArtists.map((artist) => artist.name).join(', ')
              : '[unknown]'
          ),
          filenamify(input.album.title ?? '[unknown]'),
          filenamify(filename)
        )
      )

      if (path.resolve(dbDownload.path) !== newPath) {
        await ensureDir(path.dirname(newPath))
        await fs.rename(dbDownload.path, newPath)
      }

      const metadata: Metadata = {
        title: input.track.title ?? null,
        artists: trackArtists.map((artist) => artist.name),
        track: 1,
        album: input.album.title ?? null,
        albumArtists: albumArtists.map((artist) => artist.name),
      }
      const outputMetadata = await writeTrackMetadata(newPath, metadata)

      let imageId: number | null = null
      const albumArt = input.album.art ? Buffer.from(input.album.art, 'base64') : null
      if (albumArt) {
        imageId = (await ctx.sys().img.getImage(albumArt)).id

        try {
          await writeTrackCoverArt(newPath, albumArt)
        } catch {
          // OGG Files sometimes fail the first time then work the second time
          await writeTrackCoverArt(newPath, albumArt)
        }
      }

      let favorite = false
      const lfm = ctx.sys().lfm
      if (lfm.status === 'logged-in' && metadata.title !== null && trackArtists.length > 0) {
        favorite = await lfm.getLovedTrack({
          track: metadata.title,
          artist: trackArtists.map((artist) => artist.name).join(', '),
        })
      }

      const dbTrack = ctx.sys().db.tracks.insert({
        title: metadata.title,
        path: newPath,
        releaseId: dbRelease.id,
        order: 0,
        imageId,
        duration: outputMetadata.length,
        favorite,
      })
      const dbTrackArtists = ctx.sys().db.trackArtists.insertManyByTrackId(
        dbTrack.id,
        trackArtists.map((a) => a.id)
      )

      ctx.sys().db.downloads.deleteTrackDownload(input.service, input.id)

      return {
        release: dbRelease,
        track: dbTrack,
        trackArtists: dbTrackArtists,
      }
    }),
})
