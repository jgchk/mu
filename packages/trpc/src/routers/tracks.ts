import { z } from 'zod'

import { isLastFmLoggedIn } from '../middleware'
import { publicProcedure, router } from '../trpc'

export const tracksRouter = router({
  getAll: publicProcedure.query(({ ctx }) => ctx.db.tracks.getAll()),
  getAllWithArtistsAndRelease: publicProcedure
    .input(
      z.object({
        favorite: z.boolean().optional(),
        limit: z.number().min(1).max(100).optional(),
        cursor: z.number().optional(),
      })
    )
    .query(({ input, ctx }) => {
      const skip = input.cursor ?? 0
      const limit = input.limit ?? 50

      const items = ctx.db.tracks.getAllWithArtistsAndRelease({
        favorite: input.favorite,
        skip,
        limit: limit + 1,
      })

      let nextCursor: number | undefined = undefined
      if (items.length > limit) {
        items.pop()
        nextCursor = skip + limit
      }

      return {
        items,
        nextCursor,
      }
    }),
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input: { id }, ctx }) => ctx.db.tracks.getWithArtists(id)),
  getByReleaseId: publicProcedure
    .input(z.object({ releaseId: z.number() }))
    .query(({ input: { releaseId }, ctx }) => ctx.db.tracks.getByReleaseId(releaseId)),
  getByReleaseIdWithArtists: publicProcedure
    .input(z.object({ releaseId: z.number() }))
    .query(({ input: { releaseId }, ctx }) => ctx.db.tracks.getByReleaseIdWithArtists(releaseId)),
  favorite: publicProcedure
    .input(z.object({ id: z.number(), favorite: z.boolean() }))
    .use(isLastFmLoggedIn)
    .mutation(async ({ input: { id, favorite }, ctx }) => {
      const dbTrack = ctx.db.tracks.update(id, { favorite })

      const artists = ctx.db.artists
        .getByTrackId(dbTrack.id)
        .sort((a, b) => a.order - b.order)
        .map((artist) => artist.name)
        .join(', ')

      if (favorite) {
        await ctx.lfm.loveTrack({ track: dbTrack.title ?? '[untitled]', artist: artists })
      } else {
        await ctx.lfm.unloveTrack({ track: dbTrack.title ?? '[untitled]', artist: artists })
      }

      return dbTrack
    }),
})
