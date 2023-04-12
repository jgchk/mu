import { z } from 'zod'

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
    .mutation(({ input: { id, favorite }, ctx }) => ctx.db.tracks.update(id, { favorite })),
})
