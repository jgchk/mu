import { TRPCError } from '@trpc/server'
import { artists, asc, eq, sql, tracks } from 'db'
import { isNotNull, uniq } from 'utils'
import { z } from 'zod'

import { protectedProcedure, router } from '../trpc'

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
    const result = ctx.sys().db.db.query.artists.findFirst({
      where: eq(artists.id, input.id),
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

    if (result === undefined) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Artist not found',
      })
    }

    const { releaseArtists: releaseArtists_, trackArtists: trackArtists_, ...artist } = result

    const trackImageIds = trackArtists_.map(({ track }) => track.imageId).filter(isNotNull)
    const releaseImageIds = releaseArtists_
      .map(({ release }) => release.tracks.find((track) => track.imageId !== null)?.imageId ?? null)
      .filter(isNotNull)

    return { ...artist, imageIds: uniq([...releaseImageIds, ...trackImageIds]) }
  }),

  getAll: protectedProcedure
    .input(z.object({ name: z.string().optional() }))
    .query(({ input, ctx }) => {
      const results = ctx.sys().db.db.query.artists.findMany({
        where: input.name
          ? sql`lower(${artists.name}) like ${'%' + input.name.toLowerCase() + '%'}`
          : undefined,
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
          imageIds: uniq([...releaseImageIds, ...trackImageIds]),
        }
      })
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const artist = ctx.sys().db.artists.get(input.id)
      console.log({ artist })
      if (artist === undefined) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Artist not found',
        })
      }
      const imageId = artist.imageId
      ctx.sys().db.db.delete(artists).where(eq(artists.id, input.id)).run()
      if (imageId !== null) {
        await ctx.sys().img.cleanupImage(imageId)
      }
      return true
    }),
})
