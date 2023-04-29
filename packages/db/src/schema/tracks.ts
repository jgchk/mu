import type Database from 'better-sqlite3'
import type { BoolLang } from 'bool-lang'
import type { InferModel, SQL } from 'drizzle-orm'
import { and, asc, desc, eq, inArray, not, or, placeholder, sql } from 'drizzle-orm'
import type { SQLiteSelect } from 'drizzle-orm/sqlite-core'
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import type { Constructor } from 'utils'
import { ifDefined } from 'utils'

import type { UpdateData } from '../utils'
import { makeUpdate } from '../utils'
import type { Artist } from './artists'
import { artists } from './artists'
import type { DatabaseBase } from './base'
import { images } from './images'
import type { PlaylistTrack } from './playlist-tracks'
import { playlistTracks } from './playlist-tracks'
import type { Release } from './releases'
import { releases } from './releases'
import type { TrackArtist } from './track-artists'
import { trackArtists } from './track-artists'
import { trackTags } from './track-tags'

export type Track = InferModel<typeof tracks>
export type InsertTrack = InferModel<typeof tracks, 'insert'>
export const tracks = sqliteTable(
  'tracks',
  {
    id: integer('id').primaryKey(),
    path: text('path').notNull(),
    title: text('title'),
    releaseId: integer('release_id').references(() => releases.id),
    order: integer('order').notNull(),
    duration: integer('duration').notNull(),
    favorite: integer('favorite').notNull(),
    imageId: integer('image_id').references(() => images.id),
  },
  (tracks) => ({
    pathUniqueIndex: uniqueIndex('pathUniqueIndex').on(tracks.path),
  })
)

export type TrackPretty = Omit<Track, 'favorite'> & {
  favorite: boolean
}
export type InsertTrackPretty = Omit<InsertTrack, 'favorite'> & {
  favorite?: boolean
}

const convertInsertTrack = (track: InsertTrackPretty): InsertTrack => ({
  ...track,
  favorite: track.favorite ? 1 : 0,
})
const convertTrack = (track: Track): TrackPretty => ({
  ...track,
  favorite: track.favorite !== 0,
})

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
    update: (id: Track['id'], data: UpdateData<InsertTrackPretty>) => TrackPretty
    getBySimilarTitle: (title: NonNullable<Track['title']>) => TrackPretty[]
    getByArtist: (artistId: TrackArtist['artistId'], filter?: TracksFilter) => TrackPretty[]
    getByArtistAndSimilarTitle: (
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
    get: (id: Track['id']) => TrackPretty
    getMany: (ids: Track['id'][]) => TrackPretty[]
    delete: (id: Track['id']) => void

    preparedQueries: PreparedQueries
    withFilter: <
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      S extends Record<string, any>,
      Q extends SQLiteSelect<'tracks', 'sync', Database.RunResult, S, 'partial' | 'multiple'>
    >(
      query_: Q,
      filter?: TracksFilter
    ) => Q
  }
}

type PreparedQueries = ReturnType<typeof prepareQueries>
const prepareQueries = (db: DatabaseBase['db']) => ({
  getTracksBySimilarTitle: db
    .select()
    .from(tracks)
    .where(sql`lower(${tracks.title}) like ${placeholder('title')}`)
    .prepare(),
  getTracksByArtistAndSimilarTitle: db
    .select()
    .from(tracks)
    .where(eq(trackArtists.artistId, placeholder('artistId')))
    .where(sql`lower(${tracks.title}) like ${placeholder('title')}`)
    .prepare(),
})

export const TracksMixin = <TBase extends Constructor<DatabaseBase>>(
  Base: TBase
): Constructor<TracksMixin> & TBase =>
  class extends Base implements TracksMixin {
    tracks: TracksMixin['tracks'] = {
      insert: (track) => {
        return convertTrack(
          this.db.insert(tracks).values(convertInsertTrack(track)).returning().get()
        )
      },

      update: (id, data) => {
        return convertTrack(
          this.db
            .update(tracks)
            .set(
              makeUpdate({
                ...data,
                favorite: ifDefined(data.favorite, (favorite) => (favorite ? 1 : 0)),
              })
            )
            .where(eq(tracks.id, id))
            .returning()
            .get()
        )
      },

      getBySimilarTitle: (title) => {
        return this.tracks.preparedQueries.getTracksBySimilarTitle
          .all({ title: `%${title.toLowerCase()}%` })
          .map(convertTrack)
      },

      getByArtist: (artistId, filter) => {
        let query = this.db
          .select({
            tracks: {
              ...tracks,
              id: sql`distinct(${tracks.id})`,
            },
          })
          .from(tracks)
          .innerJoin(trackArtists, eq(tracks.id, trackArtists.trackId))
          .where(eq(trackArtists.artistId, artistId))
          .orderBy(tracks.title)

        query = this.tracks.withFilter(query, filter)

        return query.all().map((row) => convertTrack(row.tracks))
      },

      getByArtistAndSimilarTitle: (artistId, title) => {
        return this.tracks.preparedQueries.getTracksByArtistAndSimilarTitle
          .all({ artistId, title: `%${title.toLowerCase()}%` })
          .map(convertTrack)
      },

      getByPath: (path) => {
        const results = this.db.select().from(tracks).where(eq(tracks.path, path)).limit(1).all()
        if (results.length === 0) {
          return undefined
        } else {
          return convertTrack(results[0])
        }
      },

      getAll: (filter) => {
        let query = this.db.select({ tracks: tracks }).from(tracks).orderBy(tracks.title)
        query = this.tracks.withFilter(query, filter)
        console.log(query.toSQL())
        return query.all().map((row) => convertTrack(row.tracks))
      },

      getByReleaseId: (releaseId, filter) => {
        let query = this.db
          .select({ tracks: tracks })
          .from(tracks)
          .where(eq(tracks.releaseId, releaseId))
          .orderBy(tracks.order)

        query = this.tracks.withFilter(query, filter)

        return query.all().map((row) => convertTrack(row.tracks))
      },

      getByPlaylistId: (playlistId, filter) => {
        let query = this.db
          .select({ tracks: tracks, playlistTrackId: playlistTracks.id })
          .from(tracks)
          .innerJoin(playlistTracks, eq(tracks.id, playlistTracks.trackId))
          .where(eq(playlistTracks.playlistId, playlistId))
          .orderBy(playlistTracks.order)

        query = this.tracks.withFilter(query, filter)

        return query.all().map((row) => ({
          ...convertTrack(row.tracks),
          playlistTrackId: row.playlistTrackId,
        }))
      },

      get: (id) => {
        return convertTrack(this.db.select().from(tracks).where(eq(tracks.id, id)).get())
      },

      getMany: (ids) => {
        if (ids.length === 0) return []
        return this.db.select().from(tracks).where(inArray(tracks.id, ids)).all().map(convertTrack)
      },

      delete: (id) => {
        return this.db.delete(tracks).where(eq(tracks.id, id)).run()
      },

      preparedQueries: prepareQueries(this.db),

      withFilter: (query_, filter) => {
        let query = query_

        const where = []

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
                  this.db
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
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore
              query = query
                .innerJoin(releases, eq(tracks.releaseId, releases.id))
                .orderBy(dir(releases.title))
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
  }

const generateWhereClause = (node: BoolLang, index = 0): SQL | undefined => {
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
