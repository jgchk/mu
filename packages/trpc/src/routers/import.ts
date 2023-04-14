import type {
  SoulseekReleaseDownload,
  SoulseekTrackDownload,
  SoundcloudPlaylistDownload,
  SoundcloudTrackDownload,
  SpotifyAlbumDownload,
  SpotifyTrackDownload,
} from 'db'
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
import type { DistributiveOmit } from 'utils'
import { ifNotNull, numDigits } from 'utils'
import { md5 } from 'utils/node'
import { z } from 'zod'

import { publicProcedure, router } from '../trpc'

type Complete<T extends { path: string | null }> = DistributiveOmit<T, 'path'> & {
  path: NonNullable<T['path']>
}
const isDownloadComplete = <T extends { path: string | null }>(
  dl: T | Complete<T>
): dl is Complete<T> => {
  return dl.path !== null
}

export const importRouter = router({
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

      const albumArtists_ =
        tracks.find((track) => track.metadata && track.metadata.albumArtists.length > 0)?.metadata
          ?.albumArtists ?? []
      const albumTitle =
        tracks.find((track) => track.metadata && track.metadata.album)?.metadata?.album ?? null

      let albumArt: Buffer | undefined
      for (const track of tracks) {
        const coverArt = await readTrackCoverArt(track.path)
        if (coverArt !== undefined) {
          albumArt = coverArt
          break
        }
      }

      const artists: Map<number, string> = new Map()

      const artistMap: Map<string, { action: 'create' | 'connect'; id: number }> = new Map()

      const getArtist = (name: string) => {
        const artist = artistMap.get(name)

        if (artist) {
          return artist
        } else {
          const dbArtist = ctx.db.artists.getByNameCaseInsensitive(name).at(0)
          if (dbArtist) {
            const artist = { action: 'connect', id: dbArtist.id } as const
            artistMap.set(name, artist)
            return artist
          } else {
            const id = artists.size + 1
            artists.set(id, name)

            const artist = { action: 'create', id } as const
            artistMap.set(name, artist)
            return artist
          }
        }
      }

      const albumArtists = albumArtists_.map(getArtist)

      return {
        artists,
        album: {
          title: albumTitle ?? undefined,
          artists: albumArtists,
          art: albumArt?.toString('base64'),
        },
        tracks: tracks.map((track) => ({
          id: track.id,
          title: track.metadata.title ?? undefined,
          artists: track.metadata.artists.map(getArtist),
          track: track.metadata.track ?? undefined,
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
          art: z.string().optional(),
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
      let releaseDownload:
        | SoulseekReleaseDownload
        | SoundcloudPlaylistDownload
        | SpotifyAlbumDownload
      let trackDownloads: (SoulseekTrackDownload | SoundcloudTrackDownload | SpotifyTrackDownload)[]
      if (input.service === 'soulseek') {
        releaseDownload = ctx.db.soulseekReleaseDownloads.get(input.id)
        trackDownloads = ctx.db.soulseekTrackDownloads.getByReleaseDownloadId(releaseDownload.id)
      } else if (input.service === 'soundcloud') {
        releaseDownload = ctx.db.soundcloudPlaylistDownloads.get(input.id)
        trackDownloads = ctx.db.soundcloudTrackDownloads.getByPlaylistDownloadId(releaseDownload.id)
      } else if (input.service === 'spotify') {
        releaseDownload = ctx.db.spotifyAlbumDownloads.get(input.id)
        trackDownloads = ctx.db.spotifyTrackDownloads.getByAlbumDownloadId(releaseDownload.id)
      } else {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        throw new Error(`Invalid service: ${input.service}`)
      }

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
        [...input.artists.entries()].map(([id, name]) => [id, ctx.db.artists.insert({ name })])
      )

      const albumArt = input.album.art ? Buffer.from(input.album.art, 'base64') : null

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
            const numDigitsInTrackNumber = numDigits(downloads.length)
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
            await fs.rename(download.dbDownload.path, newPath)
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
          const outputMetadata = await writeTrackMetadata(newPath, metadata)

          if (albumArt) {
            try {
              await writeTrackCoverArt(newPath, albumArt)
            } catch {
              // OGG Files sometimes fail the first time then work the second time
              await writeTrackCoverArt(newPath, albumArt)
            }
          }

          const coverArtHash = ifNotNull(albumArt, md5)

          const lastFm = await ctx.lfm.getTrackInfoUser({
            track: metadata.title ?? '[untitled]',
            artist: artists.map((artist) => artist.name).join(', '),
          })
          const favorite = lastFm.userloved === '1'

          const dbTrack = ctx.db.tracks.insertWithArtists({
            title: metadata.title,
            artists: artists.map((artist) => artist.id),
            path: newPath,
            releaseId: dbRelease.id,
            trackNumber: metadata.track,
            coverArtHash,
            duration: outputMetadata.length,
            favorite,
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

      const metadata = await readTrackMetadata(dbDownload.path)
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
        await fs.rename(dbDownload.path, newPath)
      }

      const metadata: Metadata = {
        title: input.title ?? null,
        artists: artists.map((artist) => artist.name),
        track: 1,
        album: input.title ?? null,
        albumArtists: artists.map((artist) => artist.name),
      }
      const outputMetadata = await writeTrackMetadata(newPath, metadata)

      const lastFm = await ctx.lfm.getTrackInfoUser({
        track: metadata.title ?? '[untitled]',
        artist: artists.map((artist) => artist.name).join(', '),
      })
      const favorite = lastFm.userloved === '1'

      const dbTrack = ctx.db.tracks.insertWithArtists({
        title: metadata.title,
        artists: artists.map((artist) => artist.id),
        path: newPath,
        releaseId: dbRelease.id,
        trackNumber: metadata.track,
        coverArtHash: null,
        duration: outputMetadata.length,
        favorite,
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
