import { TRPCError } from '@trpc/server'
import type { SQL } from 'db'
import { and, artists, asc, convertTrack, desc, eq, releases, sql, trackArtists, tracks } from 'db'
import { generateWhereClause } from 'db/src/helpers/tracks'
import { ifNotNull } from 'utils'
import { z } from 'zod'

import { protectedProcedure, router } from '../trpc'
import { TracksFilter, injectDescendants } from '../utils'

export const tracksRouter = router({
  getAllWithArtistsAndRelease: protectedProcedure.input(TracksFilter).query(({ input, ctx }) => {
    const skip = input.cursor ?? 0
    const limit = input.limit ?? 50

    const where = []

    if (input.title) {
      where.push(sql`lower(${tracks.title}) like ${'%' + input.title.toLowerCase() + '%'}`)
    }

    if (input.favorite !== undefined) {
      where.push(eq(tracks.favorite, input.favorite ? 1 : 0))
    }

    if (input.tags) {
      const tagsWithDescendants = injectDescendants(ctx.sys().db)(input.tags)
      const tagsWhere = generateWhereClause(tagsWithDescendants)
      if (tagsWhere) {
        where.push(tagsWhere)
      }
    }

    let orderBy: SQL | undefined
    if (input.sort) {
      const dir = input.sort.direction === 'asc' ? asc : desc

      switch (input.sort.column) {
        case 'title': {
          orderBy = dir(tracks.title)
          break
        }
        case 'artists': {
          orderBy = dir(
            ctx
              .sys()
              .db.db.select({ name: sql`group_concat(${artists.name}, ', ')` })
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
            ctx
              .sys()
              .db.db.select({ title: releases.title })
              .from(releases)
              .where(eq(tracks.releaseId, releases.id))
          )
          break
        }
        case 'duration': {
          orderBy = dir(tracks.duration)
          break
        }
      }
    }

    const results = ctx.sys().db.db.query.tracks.findMany({
      where: and(...where),
      orderBy,
      offset: skip,
      limit: limit + 1,
      with: {
        release: true,
        trackArtists: {
          orderBy: trackArtists.order,
          with: { artist: true },
        },
      },
    })

    let nextCursor: number | undefined = undefined
    if (results.length > limit) {
      results.pop()
      nextCursor = skip + limit
    }

    const formattedResults = results.map(({ trackArtists, ...track }) => ({
      ...convertTrack(track),
      artists: trackArtists.map((trackArtist) => trackArtist.artist),
    }))

    return {
      items: formattedResults,
      nextCursor,
    }
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
