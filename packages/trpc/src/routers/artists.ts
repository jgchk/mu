import { z } from 'zod'

import { publicProcedure, router } from '../trpc'

export const artistsRouter = router({
  add: publicProcedure
    .input(z.object({ name: z.string() }))
    .mutation(({ ctx, input }) => ctx.db.artists.insert({ name: input.name })),
  getFull: publicProcedure.input(z.object({ id: z.number() })).query(({ ctx, input }) => {
    const artist = ctx.db.artists.get(input.id)
    const releases = ctx.db.releases.getByArtistWithArtists(artist.id).map((release) => ({
      ...release,
      coverArtHash: ctx.db.tracks.getByReleaseId(release.id).find((track) => track.coverArtHash)
        ?.coverArtHash,
    }))
    const tracks = ctx.db.tracks.getByArtistWithArtists(artist.id)
    return {
      ...artist,
      releases,
      tracks,
    }
  }),
  getAll: publicProcedure.query(({ ctx }) => ctx.db.artists.getAll()),
})
