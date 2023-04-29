import filenamify from 'filenamify'
import fs from 'fs/promises'
import type { Metadata } from 'music-metadata'
import { writeTrackCoverArt, writeTrackMetadata } from 'music-metadata'
import path from 'path'
import { numDigits, uniq } from 'utils'
import { ensureDir } from 'utils/node'
import { z } from 'zod'

import { publicProcedure, router } from '../trpc'
import { TracksFilter } from '../utils'

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
    ctx.db.releases.getAll().map((release) => ({
      ...release,
      artists: ctx.db.artists.getByReleaseId(release.id),
      imageId:
        ctx.db.tracks.getByReleaseId(release.id).find((track) => track.imageId !== null)?.imageId ??
        null,
    }))
  ),
  getWithArtists: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input: { id }, ctx }) => {
      const release = ctx.db.releases.get(id)
      return {
        ...release,
        artists: ctx.db.artists.getByReleaseId(release.id),
        imageId:
          ctx.db.tracks.getByReleaseId(release.id).find((track) => track.imageId !== null)
            ?.imageId ?? null,
      }
    }),
  tracks: publicProcedure
    .input(z.object({ id: z.number() }).and(TracksFilter))
    .query(({ input: { id, ...filter }, ctx }) =>
      ctx.db.tracks.getByReleaseId(id, filter).map((track) => ({
        ...track,
        artists: ctx.db.artists.getByTrackId(track.id),
      }))
    ),
  getByTag: publicProcedure
    .input(z.object({ tagId: z.number() }))
    .query(({ input: { tagId }, ctx }) => {
      const descendants = ctx.db.tags.getDescendants(tagId)
      const ids = [tagId, ...descendants.map((t) => t.id)]
      const releaseTags = ctx.db.releaseTags.getByTags(ids)
      const releaseIds = uniq(releaseTags.map((rt) => rt.releaseId))
      return releaseIds.map((id) => ({
        ...ctx.db.releases.get(id),
        imageId:
          ctx.db.tracks.getByReleaseId(id).find((track) => track.imageId !== null)?.imageId ?? null,
      }))
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

      const dbRelease = ctx.db.releases.update(input.id, {
        title: albumTitle,
      })
      ctx.db.releaseArtists.updateByReleaseId(
        input.id,
        albumArtists.map((a) => a.id)
      )

      const existingDbTracks = ctx.db.tracks.getByReleaseId(dbRelease.id)

      let image: { data: Buffer; id: number } | undefined = undefined
      const albumArt = input.album.art ? Buffer.from(input.album.art, 'base64') : null
      if (albumArt) {
        image = {
          data: albumArt,
          id: (await ctx.img.getImage(albumArt)).id,
        }
      }

      if (input.tracks) {
        await Promise.all(
          input.tracks.map(async (track, i) => {
            const existingDbTrack = ctx.db.tracks.get(track.id)

            const trackNumber = i + 1

            let filename = ''
            const numDigitsInTrackNumber = numDigits(existingDbTracks.length)
            filename += trackNumber.toString().padStart(numDigitsInTrackNumber, '0')
            filename += ' '
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
              track: trackNumber,
              album: albumTitle ?? null,
              albumArtists: albumArtists.map((artist) => artist.name),
            }
            await writeTrackMetadata(newPath, metadata)

            const oldImageId = existingDbTrack.imageId

            if (image) {
              try {
                await writeTrackCoverArt(newPath, image.data)
              } catch {
                // OGG Files sometimes fail the first time then work the second time
                await writeTrackCoverArt(newPath, image.data)
              }
            }

            ctx.db.tracks.update(existingDbTrack.id, {
              title: metadata.title,
              path: newPath,
              releaseId: dbRelease.id,
              order: i,
              imageId: image?.id ?? null,
            })
            ctx.db.trackArtists.updateByTrackId(
              existingDbTrack.id,
              artists.map((a) => a.id)
            )

            if (oldImageId !== null) {
              await ctx.img.cleanupImage(oldImageId)
            }
          })
        )
      }

      const release = ctx.db.releases.get(dbRelease.id)
      const tracks = ctx.db.tracks.getByReleaseId(dbRelease.id)
      const artists = ctx.db.artists.getByReleaseId(dbRelease.id)
      return {
        ...release,
        tracks,
        artists,
      }
    }),
})
