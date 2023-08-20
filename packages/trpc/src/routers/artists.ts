import { TRPCError } from '@trpc/server'
import { artists, asc, eq, releaseArtists, releases, tracks } from 'db'
import { ifNotNull, isNotNull } from 'utils'
import { z } from 'zod'

import { protectedProcedure, router } from '../trpc'
import { TracksFilter } from '../utils'

export const artistsRouter = router({
  add: protectedProcedure
    .input(z.object({ name: z.string() }))
    .mutation(({ ctx, input }) => ctx.sys().db.artists.insert({ name: input.name })),

  edit: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        data: z.object({ name: z.string().min(1), description: z.string().nullable() }),
        art: z.string().nullish(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const oldImageId = ctx.sys().db.artists.get(input.id)?.imageId ?? null

      let image: { data: Buffer; id: number } | null | undefined =
        input.art === null ? null : undefined
      const art = input.art ? Buffer.from(input.art, 'base64') : null
      if (art) {
        image = {
          data: art,
          id: (await ctx.sys().img.getImage(art)).id,
        }
      }

      const imageId = image === null ? null : image?.id
      const artist = ctx.sys().db.artists.update(input.id, {
        ...input.data,
        imageId,
      })

      if (artist === undefined) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Artist not found',
        })
      }

      if (imageId !== undefined && oldImageId !== null) {
        await ctx.sys().img.cleanupImage(oldImageId)
      }

      return artist
    }),

  get: protectedProcedure.input(z.object({ id: z.number() })).query(({ ctx, input }) => {
    const artist = ctx.sys().db.artists.get(input.id)

    if (artist === undefined) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Artist not found',
      })
    }

    const releaseImageIds = ctx
      .sys()
      .db.releases.getByArtist(artist.id)
      .map(
        (release) =>
          ctx
            .sys()
            .db.tracks.getByReleaseId(release.id)
            .find((track) => track.imageId !== null)?.imageId ?? null
      )
      .filter(isNotNull)
    const trackImageIds = ctx
      .sys()
      .db.tracks.getByArtist(artist.id)
      .map((track) => track.imageId)
      .filter(isNotNull)

    return {
      ...artist,
      imageIds: [...releaseImageIds, ...trackImageIds],
    }
  }),

  releases: protectedProcedure.input(z.object({ id: z.number() })).query(({ ctx, input }) => {
    const results = ctx.sys().db.db.query.releases.findMany({
      where: eq(releases.id, input.id),
      with: {
        releaseArtists: {
          orderBy: asc(releaseArtists.order),
          with: {
            artist: true,
          },
        },
        tracks: {
          orderBy: asc(tracks.order),
        },
      },
    })

    return results.map(({ releaseArtists, ...release }) => ({
      ...release,
      artists: releaseArtists.map(({ artist }) => artist),
      imageId: release.tracks.find((track) => track.imageId !== null)?.imageId ?? null,
    }))
  }),

  tracks: protectedProcedure
    .input(z.object({ id: z.number() }).and(TracksFilter))
    .query(({ ctx, input: { id, ...filter } }) =>
      ctx
        .sys()
        .db.tracks.getByArtist(id, filter)
        .map((track) => ({
          ...track,
          release: ifNotNull(track.releaseId, (releaseId) => ctx.sys().db.releases.get(releaseId)),
          artists: ctx.sys().db.artists.getByTrackId(track.id),
        }))
    ),

  getAll: protectedProcedure.query(({ ctx }) => {
    const results = ctx.sys().db.db.query.artists.findMany({
      orderBy: asc(artists.name),
      with: {
        releaseArtists: {
          with: {
            release: {
              with: {
                tracks: {
                  orderBy: asc(tracks.order),
                },
              },
            },
          },
        },
        trackArtists: {
          with: {
            track: true,
          },
        },
      },
    })

    return results.map(({ releaseArtists, trackArtists, ...artist }) => {
      const trackImageIds = trackArtists.map(({ track }) => track.imageId).filter(isNotNull)

      const releaseImageIds = releaseArtists
        .map(
          ({ release }) => release.tracks.find((track) => track.imageId !== null)?.imageId ?? null
        )
        .filter(isNotNull)

      return {
        ...artist,
        imageIds: [...releaseImageIds, ...trackImageIds],
      }
    })
  }),
})
