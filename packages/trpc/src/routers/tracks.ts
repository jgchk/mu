import { ifNotNull } from 'utils'
import { z } from 'zod'

import { isLastFmLoggedIn } from '../middleware'
import { publicProcedure, router } from '../trpc'

export const tracksRouter = router({
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

      const tracks = ctx.db.tracks.getAll({
        favorite: input.favorite,
        skip,
        limit: limit + 1,
      })

      let nextCursor: number | undefined = undefined
      if (tracks.length > limit) {
        tracks.pop()
        nextCursor = skip + limit
      }

      const tracksWithArtistsAndRelease = tracks.map((track) => ({
        ...track,
        artists: ctx.db.artists.getByTrackId(track.id),
        release: ifNotNull(track.releaseId, (releaseId) => ctx.db.releases.get(releaseId)),
      }))

      return {
        items: tracksWithArtistsAndRelease,
        nextCursor,
      }
    }),
  getById: publicProcedure.input(z.object({ id: z.number() })).query(({ input: { id }, ctx }) => ({
    ...ctx.db.tracks.get(id),
    artists: ctx.db.artists.getByTrackId(id),
  })),
  getByReleaseId: publicProcedure
    .input(z.object({ releaseId: z.number() }))
    .query(({ input: { releaseId }, ctx }) => ctx.db.tracks.getByReleaseId(releaseId)),
  getByReleaseIdWithArtists: publicProcedure
    .input(z.object({ releaseId: z.number() }))
    .query(({ input: { releaseId }, ctx }) => {
      const tracks = ctx.db.tracks.getByReleaseId(releaseId)
      return tracks.map((track) => ({
        ...track,
        artists: ctx.db.artists.getByTrackId(track.id),
      }))
    }),
  favorite: publicProcedure
    .input(z.object({ id: z.number(), favorite: z.boolean() }))
    .use(isLastFmLoggedIn)
    .mutation(async ({ input: { id, favorite }, ctx }) => {
      const dbTrack = ctx.db.tracks.update(id, { favorite })

      const artists = ctx.db.artists
        .getByTrackId(dbTrack.id)
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
