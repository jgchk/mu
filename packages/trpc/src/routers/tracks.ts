import { ifDefined, ifNotNull } from 'utils'
import { z } from 'zod'

import { protectedProcedure, router } from '../trpc'
import { TracksFilter, injectDescendants } from '../utils'

export const tracksRouter = router({
  getAllWithArtistsAndRelease: protectedProcedure.input(TracksFilter).query(({ input, ctx }) => {
    const skip = input.cursor ?? 0
    const limit = input.limit ?? 50

    const tracks = ctx.db.tracks.getAll({
      favorite: input.favorite,
      tags: ifDefined(input.tags, injectDescendants(ctx.db)),
      sort: input.sort,
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

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input: { id }, ctx }) => ({
      ...ctx.db.tracks.get(id),
      artists: ctx.db.artists.getByTrackId(id),
    })),

  getMany: protectedProcedure
    .input(z.object({ ids: z.array(z.number()) }))
    .query(({ input: { ids }, ctx }) => {
      const tracks = ctx.db.tracks.getMany(ids)
      return tracks.map((track) => ({
        ...track,
        artists: ctx.db.artists.getByTrackId(track.id),
      }))
    }),

  getByReleaseId: protectedProcedure
    .input(z.object({ releaseId: z.number() }))
    .query(({ input: { releaseId }, ctx }) => ctx.db.tracks.getByReleaseId(releaseId)),

  getByReleaseIdWithArtists: protectedProcedure
    .input(z.object({ releaseId: z.number() }))
    .query(({ input: { releaseId }, ctx }) => {
      const tracks = ctx.db.tracks.getByReleaseId(releaseId)
      return tracks.map((track) => ({
        ...track,
        artists: ctx.db.artists.getByTrackId(track.id),
      }))
    }),

  getByTag: protectedProcedure
    .input(z.object({ tagId: z.number(), filter: TracksFilter.optional() }))
    .query(({ input: { tagId, filter }, ctx }) => {
      const descendants = ctx.db.tags.getDescendants(tagId)
      const ids = [tagId, ...descendants.map((t) => t.id)]
      const tracks = ctx.db.tracks.getByTagIds(ids, filter)
      return tracks.map((track) => ({
        ...track,
        artists: ctx.db.artists.getByTrackId(track.id),
      }))
    }),

  favorite: protectedProcedure
    .input(z.object({ id: z.number(), favorite: z.boolean() }))
    .mutation(async ({ input: { id, favorite }, ctx }) => {
      const dbTrack = ctx.db.tracks.update(id, { favorite })

      const artists = ctx.db.artists
        .getByTrackId(dbTrack.id)
        .map((artist) => artist.name)
        .join(', ')

      if (ctx.lfm.status === 'logged-in') {
        if (favorite) {
          await ctx.lfm.loveTrack({ track: dbTrack.title ?? '[untitled]', artist: artists })
        } else {
          await ctx.lfm.unloveTrack({ track: dbTrack.title ?? '[untitled]', artist: artists })
        }
      }

      return dbTrack
    }),
})
