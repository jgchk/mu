import { isNotNull } from 'utils'
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
      imageId:
        ctx.db.tracks.getByReleaseId(release.id).find((track) => track.imageId !== null)?.imageId ??
        null,
    }))
    const tracks = ctx.db.tracks.getByArtistWithArtists(artist.id)
    return {
      ...artist,
      releases,
      tracks,
    }
  }),
  getAll: publicProcedure.query(({ ctx }) => {
    const artists = ctx.db.artists.getAll()
    return artists.map((artist) => {
      const releaseImageIds = ctx.db.releases
        .getByArtist(artist.id)
        .map(
          (release) =>
            ctx.db.tracks.getByReleaseId(release.id).find((track) => track.imageId !== null)
              ?.imageId ?? null
        )
        .filter(isNotNull)
      const trackImageIds = ctx.db.tracks
        .getByArtist(artist.id)
        .map((track) => track.imageId)
        .filter(isNotNull)
      return { ...artist, imageIds: [...releaseImageIds, ...trackImageIds] }
    })
  }),
})
