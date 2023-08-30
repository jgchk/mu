import { TRPCError } from '@trpc/server'
import type { BoolLang } from 'bool-lang'
import { decode } from 'bool-lang'
import type { Filter } from 'bool-lang/src/ast'
import type { Database, SQL } from 'db'
import {
  and,
  artists,
  asc,
  desc,
  eq,
  getTableColumns,
  inArray,
  not,
  or,
  playlistTracks,
  playlists,
  releases,
  sql,
  tags,
  trackArtists,
  trackTags,
  tracks,
} from 'db'
import { ifDefined } from 'utils'
import { z } from 'zod'

import { protectedProcedure, router } from '../trpc'
import { BoolLangString, Pagination, SortDirection, injectDescendants } from '../utils'

export type TracksSortColumn = z.infer<typeof TracksSortColumn>
export const TracksSortColumn = z.enum(['title', 'artists', 'release', 'duration', 'order'])

export type TracksSort = z.infer<typeof TracksSort>
export const TracksSort = z.object({
  column: TracksSortColumn,
  direction: SortDirection,
})

export type TracksFilters = z.infer<typeof TracksFilters>
export const TracksFilters = z.object({
  artistId: z.number().optional(),
  releaseId: z.number().optional(),
  title: z.string().optional(),
  favorite: z.boolean().optional(),
  tags: BoolLangString.optional(),
  sort: TracksSort.optional(),
})

export type TracksOptions = z.infer<typeof TracksOptions>
export const TracksOptions = TracksFilters.and(Pagination)

const getAllTracks = (db: Database, input: TracksFilters & { skip?: number; limit?: number }) => {
  const where = []

  if (input.title) {
    where.push(sql`lower(${tracks.title}) like ${'%' + input.title.toLowerCase() + '%'}`)
  }
  if (input.artistId !== undefined) {
    where.push(
      inArray(
        tracks.id,
        db.db
          .select({ data: trackArtists.trackId })
          .from(trackArtists)
          .where(eq(trackArtists.artistId, input.artistId))
      )
    )
  }
  if (input.releaseId !== undefined) {
    where.push(eq(tracks.releaseId, input.releaseId))
  }

  if (input.favorite !== undefined) {
    where.push(eq(tracks.favorite, input.favorite))
  }

  if (input.tags) {
    const tagsWithDescendants = injectDescendants(db)(input.tags)
    const tagsWhere = generateWhereClause(tagsWithDescendants)
    if (tagsWhere) {
      where.push(tagsWhere)
    }
  }

  let orderBy: SQL | undefined
  const sort = input.sort ?? {
    column: input.releaseId !== undefined ? 'order' : 'title',
    direction: 'asc',
  }
  const dir = sort.direction === 'asc' ? asc : desc
  switch (sort.column) {
    case 'title': {
      orderBy = dir(tracks.title)
      break
    }
    case 'artists': {
      orderBy = dir(
        db.db
          .select({ name: sql`group_concat(${artists.name}, ', ')` })
          .from(trackArtists)
          .where(eq(trackArtists.trackId, tracks.id))
          .innerJoin(artists, eq(trackArtists.artistId, artists.id))
          .orderBy(trackArtists.order)
          .groupBy(trackArtists.trackId)
      )
      break
    }
    case 'release': {
      orderBy = dir(
        db.db
          .select({ title: releases.title })
          .from(releases)
          .where(eq(tracks.releaseId, releases.id))
      )
      break
    }
    case 'duration': {
      orderBy = dir(tracks.duration)
      break
    }
    case 'order': {
      orderBy = dir(tracks.order)
    }
  }

  let query = db.db
    .select({ ...getTableColumns(tracks), release: releases })
    .from(tracks)
    .leftJoin(releases, eq(tracks.releaseId, releases.id))
    .where(and(...where))
    .orderBy(orderBy)

  if (input.skip !== undefined) {
    query = query.offset(input.skip)
  }
  if (input.limit !== undefined) {
    query = query.limit(input.limit)
  }

  const results = query.all().map((track) => ({
    ...track,
    artists: db.db
      .select(getTableColumns(artists))
      .from(trackArtists)
      .leftJoin(artists, eq(trackArtists.artistId, artists.id))
      .where(eq(trackArtists.trackId, track.id))
      .orderBy(trackArtists.order)
      .all(),
    tags: db.db
      .select(getTableColumns(tags))
      .from(trackTags)
      .leftJoin(tags, eq(trackTags.tagId, tags.id))
      .where(eq(trackTags.trackId, track.id))
      .all(),
  }))

  return results
}

export const tracksRouter = router({
  getAll: protectedProcedure.input(TracksOptions).query(({ input, ctx }) => {
    const skip = input.cursor ?? 0
    const limit = input.limit ?? 50

    const items = getAllTracks(ctx.sys().db, { ...input, skip, limit: limit + 1 })

    let nextCursor: number | undefined = undefined
    if (items.length > limit) {
      items.pop()
      nextCursor = skip + limit
    }

    return { items, nextCursor }
  }),

  getByReleaseId: protectedProcedure
    .input(
      z.object({
        releaseId: z.number(),
        filter: TracksFilters.omit({ releaseId: true }).optional(),
      })
    )
    .query(({ input: { releaseId, filter }, ctx }) =>
      getAllTracks(ctx.sys().db, { ...filter, releaseId })
    ),

  getByPlaylistId: protectedProcedure
    .input(z.object({ playlistId: z.number(), filter: TracksFilters.optional() }))
    .query(({ input: { playlistId, filter }, ctx }) => {
      const result = ctx.sys().db.db.query.playlists.findFirst({
        where: eq(playlists.id, playlistId),
        with: {
          playlistTracks: {
            orderBy: asc(playlistTracks.order),
            with: {
              track: {
                with: {
                  release: true,
                  trackArtists: {
                    orderBy: asc(trackArtists.order),
                    with: {
                      artist: true,
                    },
                  },
                  trackTags: {
                    with: {
                      tag: true,
                    },
                  },
                },
              },
            },
          },
        },
      })

      if (result === undefined) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Playlist not found',
        })
      }

      let tracks: (ReturnType<typeof getAllTracks>[number] & { playlistTrackId?: number })[]
      if (result.filter !== null) {
        const tagsFilter = decode(result.filter)
        tracks = getAllTracks(ctx.sys().db, {
          ...filter,
          tags: tagsFilter,
        }).map((track) => ({
          ...track,
          playlistTrackId: undefined,
        }))
      } else {
        tracks = result.playlistTracks.map(
          ({ id, track: { trackArtists, trackTags, ...track } }) => ({
            ...track,
            artists: trackArtists.map(({ artist, order }) => ({ ...artist, order })),
            tags: trackTags.map(({ tag }) => tag),
            playlistTrackId: id,
          })
        )
      }

      return tracks
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input: { id }, ctx }) => {
      const result = ctx.sys().db.db.query.tracks.findFirst({
        where: eq(tracks.id, id),
        with: {
          release: true,
          trackArtists: {
            orderBy: asc(trackArtists.order),
            with: {
              artist: true,
            },
          },
          trackTags: {
            with: {
              tag: true,
            },
          },
        },
      })

      if (result === undefined) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Track not found',
        })
      }

      const { trackArtists: trackArtists_, trackTags: trackTags_, ...track } = result

      return {
        ...track,
        artists: trackArtists_.map(({ artist, order }) => ({ ...artist, order })),
        tags: trackTags_.map(({ tag }) => tag),
      }
    }),

  getMany: protectedProcedure
    .input(z.object({ ids: z.array(z.number()) }))
    .query(({ input: { ids }, ctx }) => {
      const results = ctx.sys().db.db.query.tracks.findMany({
        where: inArray(tracks.id, ids),
        with: {
          release: true,
          trackArtists: {
            orderBy: asc(trackArtists.order),
            with: {
              artist: true,
            },
          },
          trackTags: {
            with: {
              tag: true,
            },
          },
        },
      })

      return results.map(({ trackArtists, trackTags, ...track }) => ({
        ...track,
        artists: trackArtists.map(({ artist, order }) => ({ ...artist, order })),
        tags: trackTags.map(({ tag }) => tag),
      }))
    }),

  getByTag: protectedProcedure
    .input(z.object({ tagId: z.number(), filter: TracksFilters.omit({ tags: true }).optional() }))
    .query(({ input: { tagId, filter }, ctx }) => {
      const tagFilter: Filter = { kind: 'id', value: tagId }
      return getAllTracks(ctx.sys().db, { ...filter, tags: tagFilter })
    }),

  favorite: protectedProcedure
    .input(z.object({ id: z.number(), favorite: z.boolean() }))
    .mutation(async ({ input: { id, favorite }, ctx }) => {
      const dbTrack = ctx.sys().db.tracks.update(id, { favorite })

      if (dbTrack === undefined) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Track not found',
        })
      }

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

export const generateWhereClause = (node: BoolLang, index = 0): SQL | undefined => {
  switch (node.kind) {
    case 'id':
      return sql`exists(select 1 from ${trackTags} where ${tracks.id} = ${trackTags.trackId} and ${trackTags.tagId} = ${node.value})`

    case 'not':
      return ifDefined(generateWhereClause(node.child, index + 1), not)

    case 'and':
      return and(...node.children.map((child, idx) => generateWhereClause(child, index + idx + 1)))

    case 'or':
      return or(...node.children.map((child, idx) => generateWhereClause(child, index + idx + 1)))
  }
}
