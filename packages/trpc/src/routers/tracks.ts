import { TRPCError } from '@trpc/server'
import { decode } from 'bool-lang'
import type { Filter } from 'bool-lang/src/ast'
import type { Database, SQL } from 'db'
import {
  and,
  artists,
  asc,
  desc,
  eq,
  inArray,
  playlistTracks,
  playlists,
  releases,
  sql,
  trackArtists,
  tracks,
} from 'db'
import { generateWhereClause } from 'db/src/helpers/tracks'
import { ifNotNull } from 'utils'
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
      break
    }
  }

  const results = db.db.query.tracks.findMany({
    where: and(...where),
    orderBy,
    offset: input.skip,
    limit: input.limit,
    with: {
      release: true,
      trackArtists: {
        orderBy: asc(trackArtists.order),
        with: { artist: true },
      },
    },
  })

  return results.map(({ trackArtists, ...track }) => ({
    ...track,
    artists: trackArtists.map((trackArtist) => trackArtist.artist),
  }))
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
                    with: {
                      artist: true,
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
        tracks = result.playlistTracks.map(({ id, track: { trackArtists, ...track } }) => ({
          ...track,
          artists: trackArtists.map(({ artist }) => artist),
          playlistTrackId: id,
        }))
      }

      return tracks
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input: { id }, ctx }) => {
      const track = ctx.sys().db.tracks.get(id)

      if (track === undefined) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Track not found',
        })
      }

      return {
        ...track,
        artists: ctx.sys().db.artists.getByTrackId(id),
        release: ifNotNull(track.releaseId, (releaseId) => ctx.sys().db.releases.get(releaseId)),
      }
    }),

  getMany: protectedProcedure
    .input(z.object({ ids: z.array(z.number()) }))
    .query(({ input: { ids }, ctx }) => {
      const tracks = ctx.sys().db.tracks.getMany(ids)
      return tracks.map((track) => ({
        ...track,
        artists: ctx.sys().db.artists.getByTrackId(track.id),
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
