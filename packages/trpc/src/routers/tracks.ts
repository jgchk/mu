import { ifDefined, ifNotNull } from 'utils'
import { z } from 'zod'

import { protectedProcedure, router } from '../trpc'
import { TracksFilter, injectDescendants } from '../utils'

export const tracksRouter = router({
  getAllWithArtistsAndRelease: protectedProcedure.input(TracksFilter).query(({ input, ctx }) => {
    const skip = input.cursor ?? 0
    const limit = input.limit ?? 50

    const tracks = ctx.sys().db.tracks.getAll({
      favorite: input.favorite,
      tags: ifDefined(input.tags, injectDescendants(ctx.sys().db)),
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
      artists: ctx.sys().db.artists.getByTrackId(track.id),
      release: ifNotNull(track.releaseId, (releaseId) => ctx.sys().db.releases.get(releaseId)),
    }))

    return {
      items: tracksWithArtistsAndRelease,
      nextCursor,
    }
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input: { id }, ctx }) => ({
      ...ctx.sys().db.tracks.get(id),
      artists: ctx.sys().db.artists.getByTrackId(id),
    })),

  getMany: protectedProcedure
    .input(z.object({ ids: z.array(z.number()) }))
    .query(({ input: { ids }, ctx }) => {
      const tracks = ctx.sys().db.tracks.getMany(ids)
      return tracks.map((track) => ({
        ...track,
        artists: ctx.sys().db.artists.getByTrackId(track.id),
      }))
    }),

  getByReleaseId: protectedProcedure
    .input(z.object({ releaseId: z.number() }))
    .query(({ input: { releaseId }, ctx }) => ctx.sys().db.tracks.getByReleaseId(releaseId)),

  getByReleaseIdWithArtists: protectedProcedure
    .input(z.object({ releaseId: z.number() }))
    .query(({ input: { releaseId }, ctx }) => {
      const tracks = ctx.sys().db.tracks.getByReleaseId(releaseId)
      return tracks.map((track) => ({
        ...track,
        artists: ctx.sys().db.artists.getByTrackId(track.id),
      }))
    }),

  getByTag: protectedProcedure
    .input(z.object({ tagId: z.number(), filter: TracksFilter.optional() }))
    .query(({ input: { tagId, filter }, ctx }) => {
      const descendants = ctx.sys().db.tags.getDescendants(tagId)
      const ids = [tagId, ...descendants.map((t) => t.id)]
      const tracks = ctx.sys().db.tracks.getByTagIds(ids, filter)
      return tracks.map((track) => ({
        ...track,
        artists: ctx.sys().db.artists.getByTrackId(track.id),
      }))
    }),

  favorite: protectedProcedure
    .input(z.object({ id: z.number(), favorite: z.boolean() }))
    .mutation(async ({ input: { id, favorite }, ctx }) => {
      const dbTrack = ctx.sys().db.tracks.update(id, { favorite })

      const artists = ctx
        .sys()
        .db.artists.getByTrackId(dbTrack.id)
        .map((artist) => artist.name)
        .join(', ')

      const lfm = ctx.sys().lfm
      if (lfm.status === 'logged-in') {
        if (favorite) {
          await lfm.loveTrack({ track: dbTrack.title ?? '[untitled]', artist: artists })
        } else {
          await lfm.unloveTrack({ track: dbTrack.title ?? '[untitled]', artist: artists })
        }
      }

      return dbTrack
    }),
})
