import { z } from 'zod'

import { publicProcedure, router } from '../trpc'

export const playlistsRouter = router({
  add: publicProcedure
    .input(z.object({ name: z.string() }))
    .mutation(({ ctx, input: { name } }) => ctx.db.playlists.insert({ name })),
  getAll: publicProcedure.query(({ ctx }) => ctx.db.playlists.getAll()),
  getWithTracks: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => ctx.db.playlists.getWithTracks(input.id)),
})
