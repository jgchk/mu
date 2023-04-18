import filenamify from 'filenamify'
import fs from 'fs/promises'
import type { Metadata } from 'music-metadata'
import { writeTrackCoverArt, writeTrackMetadata } from 'music-metadata'
import path from 'path'
import { ifDefined, numDigits } from 'utils'
import { dirExists, ensureDir, md5 } from 'utils/node'
import { z } from 'zod'

import { getMetadataFromTrack } from '../services/music-metadata'
import { publicProcedure, router } from '../trpc'

export const releasesRouter = router({
  getAll: publicProcedure.query(({ ctx }) =>
    ctx.db.releases.getAll().map((release) => ({
      ...release,
      imageId:
        ctx.db.tracks.getByReleaseId(release.id).find((track) => track.imageId !== null)?.imageId ??
        null,
    }))
  ),
  getAllWithArtists: publicProcedure.query(({ ctx }) =>
    ctx.db.releases.getAllWithArtists().map((release) => ({
      ...release,
      imageId:
        ctx.db.tracks.getByReleaseId(release.id).find((track) => track.imageId !== null)?.imageId ??
        null,
    }))
  ),
  getWithTracksAndArtists: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input: { id }, ctx }) => {
      const release = ctx.db.releases.getWithTracksAndArtists(id)
      return {
        ...release,
        imageId:
          ctx.db.tracks.getByReleaseId(release.id).find((track) => track.imageId !== null)
            ?.imageId ?? null,
      }
    }),
  updateWithTracksAndArtists: publicProcedure
    .input(
      z.object({
        id: z.number(),
        createArtists: z.map(z.number(), z.string()),
        album: z.object({
          title: z.string().min(1).optional(),
          artists: z.object({ action: z.enum(['create', 'connect']), id: z.number() }).array(),
          art: z.string().optional(),
        }),
        tracks: z
          .object({
            id: z.number(),
            title: z.string().optional(),
            artists: z.object({ action: z.enum(['create', 'connect']), id: z.number() }).array(),
            track: z.number().optional(),
          })
          .array(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const artistMap = new Map(
        [...input.createArtists.entries()].map(([id, name]) => [
          id,
          ctx.db.artists.insert({ name }),
        ])
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

      const dbRelease = ctx.db.releases.updateWithArtists(input.id, {
        title: albumTitle,
        artists: albumArtists.map((artist) => artist.id),
      })

      const existingDbTracks = ctx.db.tracks.getByReleaseId(dbRelease.id)

      if (input.tracks) {
        await Promise.all(
          input.tracks.map(async (track) => {
            const existingDbTrack = ctx.db.tracks.get(track.id)

            let filename = ''
            if (track.track !== undefined) {
              const numDigitsInTrackNumber = numDigits(existingDbTracks.length)
              filename += track.track.toString().padStart(numDigitsInTrackNumber, '0')
              filename += ' '
            }
            filename += track.title ?? '[untitled]'
            filename += path.extname(existingDbTrack.path)

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

            if (path.resolve(existingDbTrack.path) !== path.resolve(newPath)) {
              await ensureDir(path.dirname(newPath))
              await fs.rename(existingDbTrack.path, newPath)
            }

            const artists = track.artists.map((artist) => {
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
              title: track.title ?? null,
              artists: artists.map((artist) => artist.name),
              track: track.track ?? null,
              album: albumTitle ?? null,
              albumArtists: albumArtists.map((artist) => artist.name),
            }
            await writeTrackMetadata(newPath, metadata)

            let imageId: number | undefined = undefined
            const albumArt = input.album.art ? Buffer.from(input.album.art, 'base64') : null
            if (albumArt) {
              imageId = ctx.db.images.insert({ hash: md5(albumArt) }).id

              const imagePath = path.resolve(path.join(ctx.imagesDir, imageId.toString()))
              await ensureDir(path.dirname(imagePath))
              await fs.writeFile(imagePath, albumArt)

              try {
                await writeTrackCoverArt(newPath, albumArt)
              } catch {
                // OGG Files sometimes fail the first time then work the second time
                await writeTrackCoverArt(newPath, albumArt)
              }
            }

            ctx.db.tracks.updateWithArtists(existingDbTrack.id, {
              title: metadata.title,
              artists: artists.map((artist) => artist.id),
              path: newPath,
              releaseId: dbRelease.id,
              trackNumber: metadata.track,
              imageId,
            })
          })
        )
      }

      return ctx.db.releases.getWithTracksAndArtists(dbRelease.id)
    }),
  updateMetadata: publicProcedure
    .input(
      z.object({
        id: z.number(),
        data: z.object({
          title: z.string(),
          artists: z.union([z.number(), z.string()]).array().optional(),
        }),
      })
    )
    .mutation(async ({ input: { id, data }, ctx }) => {
      const artists = ifDefined(data.artists, (artists) =>
        artists.map((artist) => {
          if (typeof artist === 'number') {
            return artist
          } else {
            return ctx.db.artists.insert({ name: artist }).id
          }
        })
      )

      const release = ctx.db.releases.updateWithArtists(id, { ...data, artists })
      const tracks = ctx.db.tracks.getByReleaseId(release.id)

      await Promise.all(
        tracks.map((track) =>
          writeTrackMetadata(track.path, getMetadataFromTrack(ctx.db, track.id))
        )
      )

      return release
    }),
})
