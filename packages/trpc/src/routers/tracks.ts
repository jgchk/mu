import { ifDefined, ifNotNull, uniq } from 'utils'
import { z } from 'zod'

import { isLastFmLoggedIn } from '../middleware'
import { publicProcedure, router } from '../trpc'

export type TrackTagsFilter =
  | number
  | {
      kind: 'and'
      tags: TrackTagsFilter[]
    }
  | {
      kind: 'or'
      tags: TrackTagsFilter[]
    }

const TrackTagsFilter: z.ZodType<TrackTagsFilter> = z.union([
  z.number(),
  z.object({
    kind: z.literal('and'),
    tags: z.lazy(() => TrackTagsFilter.array()),
  }),
  z.object({
    kind: z.literal('or'),
    tags: z.lazy(() => TrackTagsFilter.array()),
  }),
])

export const tracksRouter = router({
  getAllWithArtistsAndRelease: publicProcedure
    .input(
      z.object({
        favorite: z.boolean().optional(),
        tags: TrackTagsFilter.optional(),
        limit: z.number().min(1).max(100).optional(),
        cursor: z.number().optional(),
      })
    )
    .query(({ input, ctx }) => {
      const skip = input.cursor ?? 0
      const limit = input.limit ?? 50

      const tags = ifDefined(input.tags, (filter) => {
        const transformTag = (filter: TrackTagsFilter): TrackTagsFilter => {
          if (typeof filter === 'number') {
            const tagId = filter
            const descendants = ctx.db.tags.getDescendants(tagId)
            const ids = [tagId, ...descendants.map((t) => t.id)]
            return {
              kind: 'or',
              tags: ids,
            }
          } else if (filter.kind === 'and') {
            return {
              kind: 'and',
              tags: filter.tags.map(transformTag),
            }
          } else if (filter.kind === 'or') {
            return {
              kind: 'or',
              tags: filter.tags.map(transformTag),
            }
          } else {
            throw new Error(`Invalid filter: ${JSON.stringify(filter)}}`)
          }
        }

        return transformTag(filter)
      })

      const tracks = ctx.db.tracks.getAll({
        favorite: input.favorite,
        tags,
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
  getMany: publicProcedure
    .input(z.object({ ids: z.array(z.number()) }))
    .query(({ input: { ids }, ctx }) => {
      const tracks = ctx.db.tracks.getMany(ids)
      return tracks.map((track) => ({
        ...track,
        artists: ctx.db.artists.getByTrackId(track.id),
      }))
    }),
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
  getByTag: publicProcedure
    .input(z.object({ tagId: z.number() }))
    .query(({ input: { tagId }, ctx }) => {
      const descendants = ctx.db.tags.getDescendants(tagId)
      const ids = [tagId, ...descendants.map((t) => t.id)]
      const trackTags = ctx.db.trackTags.getByTags(ids)
      const trackIds = uniq(trackTags.map((tt) => tt.trackId))
      return trackIds.map((id) => ({
        ...ctx.db.tracks.get(id),
        artists: ctx.db.artists.getByTrackId(id),
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
