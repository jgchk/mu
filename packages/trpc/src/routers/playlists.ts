import { z } from 'zod'

import { publicProcedure, router } from '../trpc'

export const playlistsRouter = router({
  new: publicProcedure
    .input(z.object({ name: z.string().min(1), tracks: z.number().array().optional() }))
    .mutation(({ ctx, input: { name, tracks } }) =>
      ctx.db.playlists.insertWithTracks({ name }, tracks)
    ),
  addTrack: publicProcedure
    .input(z.object({ playlistId: z.number(), trackId: z.number() }))
    .mutation(({ ctx, input: { playlistId, trackId } }) =>
      ctx.db.playlists.addTrack(playlistId, trackId)
    ),
  getAll: publicProcedure.query(({ ctx }) => ctx.db.playlists.getAll()),
  getWithTracks: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => ctx.db.playlists.getWithTracks(input.id)),
})
