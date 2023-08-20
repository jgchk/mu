import type Database from 'better-sqlite3'
import type { BoolLang } from 'bool-lang'
import type { SQL } from 'drizzle-orm'
import { and, asc, desc, eq, inArray, not, or, placeholder, sql } from 'drizzle-orm'
import type { SQLiteSelect } from 'drizzle-orm/sqlite-core'
import { ifDefined, withProps } from 'utils'

import type { Artist } from '../schema/artists'
import { artists } from '../schema/artists'
import type { PlaylistTrack } from '../schema/playlist-tracks'
import { playlistTracks } from '../schema/playlist-tracks'
import type { Release } from '../schema/releases'
import { releases } from '../schema/releases'
import type { TrackArtist } from '../schema/track-artists'
import { trackArtists } from '../schema/track-artists'
import { trackTags } from '../schema/track-tags'
import type { InsertTrackPretty, Track, TrackPretty } from '../schema/tracks'
import { convertInsertTrack, convertTrack, tracks } from '../schema/tracks'
import type { UpdateData } from '../utils'
import { hasUpdate, makeUpdate } from '../utils'
import type { DatabaseBase } from './base'

export type TracksFilter = {
  favorite?: boolean
  tags?: BoolLang
  sort?: TracksSort
  skip?: number
  limit?: number
}
export type TracksSort = {
  column: TracksSortColumn
  direction: TracksSortDirection
}
export type TracksSortColumn = 'title' | 'artists' | 'release' | 'duration'
export type TracksSortDirection = 'asc' | 'desc'

export type TracksMixin = {
  tracks: {
    insert: (track: InsertTrackPretty) => TrackPretty
    update: (id: Track['id'], data: UpdateData<InsertTrackPretty>) => TrackPretty | undefined
    getByArtist: (artistId: TrackArtist['artistId'], filter?: TracksFilter) => TrackPretty[]
    getByArtistAndTitleCaseInsensitive: (
      artistId: Artist['id'],
      title: NonNullable<Track['title']>
    ) => TrackPretty[]
    getByPath: (path: Track['path']) => TrackPretty | undefined
    getAll: (filter?: TracksFilter) => TrackPretty[]
    getByReleaseId: (releaseId: Release['id'], filter?: TracksFilter) => TrackPretty[]
    getByPlaylistId: (
      playlistId: number,
      filter?: TracksFilter
    ) => (TrackPretty & { playlistTrackId: PlaylistTrack['id'] })[]
    getByTagIds: (tagIds: number[], filter?: TracksFilter) => TrackPretty[]
    get: (id: Track['id']) => TrackPretty | undefined
    getMany: (ids: Track['id'][]) => TrackPretty[]
    delete: (id: Track['id']) => void

    preparedQueries: PreparedQueries
    withFilter: <
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      S extends Record<string, any>,
      Q extends SQLiteSelect<'tracks', 'sync', Database.RunResult, S, 'partial' | 'multiple'>
    >(
      query_: Q,
      filter?: TracksFilter,
      where?: SQL[]
    ) => Q
  }
}

type PreparedQueries = ReturnType<typeof prepareQueries>
const prepareQueries = (db: DatabaseBase['db']) => ({
  getByArtistAndTitleCaseInsensitive: db
    .select()
    .from(tracks)
    .where(eq(trackArtists.artistId, placeholder('artistId')))
    .where(sql`lower(${tracks.title}) = ${placeholder('title')}`)
    .prepare(),
})

export const TracksMixin = <T extends DatabaseBase>(base: T): T & TracksMixin => {
  const tracksMixin: TracksMixin['tracks'] = {
    insert: (track) => {
      return convertTrack(
        base.db.insert(tracks).values(convertInsertTrack(track)).returning().get()
      )
    },

    update: (id, data) => {
      const update = makeUpdate({
        ...data,
        favorite: ifDefined(data.favorite, (favorite) => (favorite ? 1 : 0)),
      })
      if (!hasUpdate(update)) return tracksMixin.get(id)
      return convertTrack(
        base.db.update(tracks).set(update).where(eq(tracks.id, id)).returning().get()
      )
    },

    getByArtist: (artistId, filter) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _, ...cols } = tracks
      let query = base.db
        .select({
          tracks: {
            ...cols,
            id: sql`distinct(${tracks.id})`,
          },
        })
        .from(tracks)
        .innerJoin(trackArtists, eq(tracks.id, trackArtists.trackId))
        .orderBy(tracks.title)

      query = tracksMixin.withFilter(query, filter, [eq(trackArtists.artistId, artistId)])

      return query.all().map((row) => convertTrack(row.tracks))
    },

    getByArtistAndTitleCaseInsensitive: (artistId, title) => {
      return tracksMixin.preparedQueries.getByArtistAndTitleCaseInsensitive
        .all({
          artistId,
          title: title.toLowerCase(),
        })
        .map(convertTrack)
    },

    getByPath: (path) => {
      const results = base.db.select().from(tracks).where(eq(tracks.path, path)).limit(1).all()
      if (results.length === 0) {
        return undefined
      } else {
        return convertTrack(results[0])
      }
    },

    getAll: (filter) => {
      let query = base.db.select({ tracks }).from(tracks).orderBy(tracks.title)
      query = tracksMixin.withFilter(query, filter)
      return query.all().map((row) => convertTrack(row.tracks))
    },

    getByReleaseId: (releaseId, filter) => {
      let query = base.db.select({ tracks }).from(tracks).orderBy(tracks.order)

      query = tracksMixin.withFilter(query, filter, [eq(tracks.releaseId, releaseId)])

      return query.all().map((row) => convertTrack(row.tracks))
    },

    getByPlaylistId: (playlistId, filter) => {
      let query = base.db
        .select({ tracks: tracks, playlistTrackId: playlistTracks.id })
        .from(tracks)
        .innerJoin(playlistTracks, eq(tracks.id, playlistTracks.trackId))
        .orderBy(playlistTracks.order)

      query = tracksMixin.withFilter(query, filter, [eq(playlistTracks.playlistId, playlistId)])

      return query.all().map((row) => ({
        ...convertTrack(row.tracks),
        playlistTrackId: row.playlistTrackId,
      }))
    },

    getByTagIds: (tagIds, filter) => {
      let query = base.db
        .select({ tracks })
        .from(tracks)
        .innerJoin(trackTags, eq(tracks.id, trackTags.trackId))
        .orderBy(tracks.title)

      query = tracksMixin.withFilter(query, filter, [inArray(trackTags.tagId, tagIds)])

      return query.all().map((row) => convertTrack(row.tracks))
    },

    get: (id) => {
      return ifDefined(base.db.select().from(tracks).where(eq(tracks.id, id)).get(), convertTrack)
    },

    getMany: (ids) => {
      if (ids.length === 0) return []
      return base.db.select().from(tracks).where(inArray(tracks.id, ids)).all().map(convertTrack)
    },

    delete: (id) => {
      return base.db.delete(tracks).where(eq(tracks.id, id)).run()
    },

    preparedQueries: prepareQueries(base.db),

    withFilter: (query_, filter, where_ = []) => {
      let query = query_

      const where = where_

      if (filter?.favorite !== undefined) {
        where.push(eq(tracks.favorite, filter.favorite ? 1 : 0))
      }

      if (filter?.tags !== undefined) {
        const tagsWhere = generateWhereClause(filter.tags)
        if (tagsWhere) {
          where.push(tagsWhere)
        }
      }

      if (where.length === 1) {
        query = query.where(where[0])
      } else if (where.length > 1) {
        query = query.where(and(...where))
      }

      if (filter?.sort) {
        const dir = filter.sort.direction === 'asc' ? asc : desc

        switch (filter.sort.column) {
          case 'title': {
            query = query.orderBy(dir(tracks.title))
            break
          }
          case 'artists': {
            query = query.orderBy(
              dir(
                base.db
                  .select({ name: sql`group_concat(${artists.name}, ', ')` })
                  .from(trackArtists)
                  .where(eq(trackArtists.trackId, tracks.id))
                  .innerJoin(artists, eq(trackArtists.artistId, artists.id))
                  .orderBy(trackArtists.order)
                  .groupBy(trackArtists.trackId)
              )
            )
            break
          }
          case 'release': {
            query = query.orderBy(
              dir(
                base.db
                  .select({ title: releases.title })
                  .from(releases)
                  .where(eq(tracks.releaseId, releases.id))
              )
            )
            break
          }
          case 'duration': {
            query = query.orderBy(dir(tracks.duration))
            break
          }
        }
      }

      if (filter?.skip !== undefined) {
        query = query.offset(filter.skip)
      }
      if (filter?.limit !== undefined) {
        query = query.limit(filter.limit)
      }

      return query
    },
  }

  return withProps(base, { tracks: tracksMixin })
}

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
