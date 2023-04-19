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
    .mutation(({ ctx, input: { playlistId, trackId } }) => {
      const track = ctx.db.playlists.addTrack(playlistId, trackId)
      const playlist = ctx.db.playlists.get(playlistId)
      return { playlist, track }
    }),
  getAll: publicProcedure.query(({ ctx }) => ctx.db.playlists.getAll()),
  getAllHasTrack: publicProcedure
    .input(z.object({ trackId: z.number() }))
    .query(({ input: { trackId }, ctx }) => {
      const playlists = ctx.db.playlists.getAll()
      return playlists.map((playlist) => {
        const hasTrack = !!ctx.db.playlistTracks.find(playlist.id, trackId)
        return { ...playlist, hasTrack }
      })
    }),
  getWithTracks: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ ctx, input }) => ctx.db.playlists.getWithTracks(input.id)),
})
