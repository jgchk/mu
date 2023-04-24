// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import type { BoolLang } from 'bool-lang'
import { ifDefined, ifNotNull, uniq } from 'utils'
import { z } from 'zod'

import { isLastFmLoggedIn } from '../middleware'
import { publicProcedure, router } from '../trpc'

const BoolLang: z.ZodType<BoolLang> = z.union([
  z.object({
    kind: z.literal('id'),
    value: z.number(),
  }),
  z.object({
    kind: z.literal('not'),
    child: z.lazy(() => BoolLang),
  }),
  z.object({
    kind: z.literal('and'),
    children: z.lazy(() => BoolLang.array()),
  }),
  z.object({
    kind: z.literal('or'),
    children: z.lazy(() => BoolLang.array()),
  }),
])

export const tracksRouter = router({
  getAllWithArtistsAndRelease: publicProcedure
    .input(
      z.object({
        favorite: z.boolean().optional(),
        tags: BoolLang.optional(),
        limit: z.number().min(1).max(100).optional(),
        cursor: z.number().optional(),
      })
    )
    .query(({ input, ctx }) => {
      const skip = input.cursor ?? 0
      const limit = input.limit ?? 50

      const tags = ifDefined(input.tags, (filter) => {
        const injectDescendants = (node: BoolLang): BoolLang => {
          switch (node.kind) {
            case 'id': {
              const descendants = ctx.db.tags.getDescendants(node.value)
              const ids = [node.value, ...descendants.map((t) => t.id)]
              return {
                kind: 'or',
                children: ids.map((id) => ({ kind: 'id', value: id })),
              }
            }
            case 'not': {
              return {
                kind: 'not',
                child: injectDescendants(node.child),
              }
            }
            case 'and': {
              return {
                kind: 'and',
                children: node.children.map(injectDescendants),
              }
            }
            case 'or': {
              return {
                kind: 'or',
                children: node.children.map(injectDescendants),
              }
            }
          }
        }

        return injectDescendants(filter)
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
