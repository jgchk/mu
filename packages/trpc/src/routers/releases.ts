import { TRPCError } from '@trpc/server'
import { env } from 'env'
import filenamify from 'filenamify'
import fs from 'fs/promises'
import type { Metadata } from 'music-metadata'
import { deleteTrackCoverArt, writeTrackCoverArt, writeTrackMetadata } from 'music-metadata'
import path from 'path'
import { isDefined, numDigits, uniq } from 'utils'
import { ensureDir } from 'utils/node'
import { z } from 'zod'

import { protectedProcedure, router } from '../trpc'
import { TracksFilter } from '../utils'

export const releasesRouter = router({
  getAll: protectedProcedure.query(({ ctx }) =>
    ctx
      .sys()
      .db.releases.getAll()
      .map((release) => ({
        ...release,
        imageId:
          ctx
            .sys()
            .db.tracks.getByReleaseId(release.id)
            .find((track) => track.imageId !== null)?.imageId ?? null,
      }))
  ),

  getAllWithArtists: protectedProcedure.query(({ ctx }) =>
    ctx
      .sys()
      .db.releases.getAll()
      .map((release) => ({
        ...release,
        artists: ctx.sys().db.artists.getByReleaseId(release.id),
        imageId:
          ctx
            .sys()
            .db.tracks.getByReleaseId(release.id)
            .find((track) => track.imageId !== null)?.imageId ?? null,
      }))
  ),

  getWithArtists: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input: { id }, ctx }) => {
      const release = ctx.sys().db.releases.get(id)

      if (release === undefined) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Release not found',
        })
      }

      return {
        ...release,
        artists: ctx.sys().db.artists.getByReleaseId(release.id),
        imageId:
          ctx
            .sys()
            .db.tracks.getByReleaseId(release.id)
            .find((track) => track.imageId !== null)?.imageId ?? null,
      }
    }),

  tracks: protectedProcedure
    .input(z.object({ id: z.number() }).and(TracksFilter))
    .query(({ input: { id, ...filter }, ctx }) =>
      ctx
        .sys()
        .db.tracks.getByReleaseId(id, filter)
        .map((track) => ({
          ...track,
          artists: ctx.sys().db.artists.getByTrackId(track.id),
        }))
    ),

  getByTag: protectedProcedure
    .input(z.object({ tagId: z.number() }))
    .query(({ input: { tagId }, ctx }) => {
      const descendants = ctx.sys().db.tags.getDescendants(tagId)
      const ids = [tagId, ...descendants.map((t) => t.id)]
      const releaseTags = ctx.sys().db.releaseTags.getByTags(ids)
      const releaseIds = uniq(releaseTags.map((rt) => rt.releaseId))
      return releaseIds.map((id) => ({
        ...ctx.sys().db.releases.get(id),
        imageId:
          ctx
            .sys()
            .db.tracks.getByReleaseId(id)
            .find((track) => track.imageId !== null)?.imageId ?? null,
      }))
    }),

  updateWithTracksAndArtists: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        createArtists: z.map(z.number(), z.string()),
        album: z.object({
          title: z.string().min(1).optional(),
          artists: z.object({ action: z.enum(['create', 'connect']), id: z.number() }).array(),
          art: z.string().nullish(),
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
          ctx.sys().db.artists.insert({ name }),
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

      const dbRelease = ctx.sys().db.releases.update(input.id, {
        title: albumTitle,
      })

      if (dbRelease === undefined) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Release not found',
        })
      }

      ctx.sys().db.releaseArtists.updateByReleaseId(
        input.id,
        albumArtists.map((a) => a.id)
      )

      const existingDbTracks = ctx.sys().db.tracks.getByReleaseId(dbRelease.id)

      let image: { data: Buffer; id: number } | null | undefined = undefined
      if (input.album.art) {
        const data = Buffer.from(input.album.art, 'base64')
        image = {
          data,
          id: (await ctx.sys().img.getImage(data)).id,
        }
      } else if (input.album.art === null) {
        image = null
      } else {
        image = undefined
      }

      if (input.tracks) {
        await Promise.all(
          input.tracks.map(async (track, i) => {
            const existingDbTrack = ctx.sys().db.tracks.get(track.id)

            if (existingDbTrack === undefined) {
              throw new TRPCError({
                code: 'NOT_FOUND',
                message: 'Track not found',
              })
            }

            const trackNumber = i + 1

            let filename = ''
            const numDigitsInTrackNumber = numDigits(existingDbTracks.length)
            filename += trackNumber.toString().padStart(numDigitsInTrackNumber, '0')
            filename += ' '
            filename += track.title ?? '[untitled]'
            filename += path.extname(existingDbTrack.path)

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

            if (existingDbTrack.path !== newPath) {
              await ensureDir(path.dirname(newPath))
              await fs.rename(existingDbTrack.path, newPath)
            }

            const artists = track.artists
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
            } else if (image === null) {
              try {
                await deleteTrackCoverArt(newPath)
              } catch {
                // OGG Files sometimes fail the first time then work the second time
                await deleteTrackCoverArt(newPath)
              }
            }

            ctx.sys().db.tracks.update(existingDbTrack.id, {
              title: metadata.title,
              path: newPath,
              releaseId: dbRelease.id,
              order: i,
              imageId: image ? image.id : image === null ? null : undefined,
            })
            ctx.sys().db.trackArtists.updateByTrackId(
              existingDbTrack.id,
              artists.map((a) => a.id)
            )

            if (oldImageId !== null && image !== undefined) {
              await ctx.sys().img.cleanupImage(oldImageId)
            }
          })
        )
      }

      const release = ctx.sys().db.releases.get(dbRelease.id)

      if (release === undefined) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Release not found',
        })
      }

      const tracks = ctx.sys().db.tracks.getByReleaseId(dbRelease.id)
      const artists = ctx.sys().db.artists.getByReleaseId(dbRelease.id)
      return {
        ...release,
        tracks,
        artists,
      }
    }),
})
