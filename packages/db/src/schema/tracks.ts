import type { InferModel } from 'drizzle-orm'
import { eq, inArray, placeholder, sql } from 'drizzle-orm'
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import type { Constructor } from 'utils'
import { ifDefined } from 'utils'

import type { UpdateData } from '../utils'
import { makeUpdate } from '../utils'
import type { Artist } from './artists'
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
  tags?: TrackTagsFilter
  skip?: number
  limit?: number
}

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

export type TracksMixin = {
  tracks: {
    preparedQueries: PreparedQueries
    insert: (track: InsertTrackPretty) => TrackPretty
    update: (id: Track['id'], data: UpdateData<InsertTrackPretty>) => TrackPretty
    getBySimilarTitle: (title: NonNullable<Track['title']>) => TrackPretty[]
    getByArtist: (artistId: TrackArtist['artistId']) => TrackPretty[]
    getByArtistAndSimilarTitle: (
      artistId: Artist['id'],
      title: NonNullable<Track['title']>
    ) => TrackPretty[]
    getByPath: (path: Track['path']) => TrackPretty | undefined
    getAll: (filter?: TracksFilter) => TrackPretty[]
    getByReleaseId: (releaseId: Release['id']) => TrackPretty[]
    getByPlaylistId: (
      playlistId: number
    ) => (TrackPretty & { playlistTrackId: PlaylistTrack['id'] })[]
    get: (id: Track['id']) => TrackPretty
    getMany: (ids: Track['id'][]) => TrackPretty[]
    delete: (id: Track['id']) => void
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
      preparedQueries: prepareQueries(this.db),

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

      getByArtist: (artistId) => {
        return this.db
          .select()
          .from(tracks)
          .innerJoin(trackArtists, eq(tracks.id, trackArtists.trackId))
          .where(eq(trackArtists.artistId, artistId))
          .orderBy(tracks.title)
          .all()
          .map((track) => convertTrack(track.tracks))
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

      getAll: ({ favorite, tags: filterTags, skip = 0, limit = 50 } = {}) => {
        let query = this.db.select().from(tracks).orderBy(tracks.title)

        if (favorite !== undefined) {
          query = query.where(eq(tracks.favorite, favorite ? 1 : 0))
        }

        if (filterTags !== undefined) {
          const tracksWithTags = this.db
            .select()
            .from(tracks)
            .innerJoin(trackTags, eq(tracks.id, trackTags.trackId))
            .all()

          const trackTagsMap = new Map<number, Set<number>>()
          for (const trackWithTags of tracksWithTags) {
            const previous = trackTagsMap.get(trackWithTags.tracks.id)
            if (previous) {
              previous.add(trackWithTags.track_tags.tagId)
            } else {
              trackTagsMap.set(trackWithTags.tracks.id, new Set([trackWithTags.track_tags.tagId]))
            }
          }

          const allTracks = query.all()

          const makeFilter =
            (filter: TrackTagsFilter): ((tracks: (typeof allTracks)[0]) => boolean) =>
            (track) => {
              const tags = trackTagsMap.get(track.id)
              if (typeof filter === 'number') {
                return tags?.has(filter) ?? false
              } else if (filter.kind === 'and') {
                return filter.tags.every((tag) => makeFilter(tag)(track))
              } else if (filter.kind === 'or') {
                return filter.tags.some((tag) => makeFilter(tag)(track))
              } else {
                throw new Error(`Invalid filter: ${JSON.stringify(filter)}`)
              }
            }

          return allTracks
            .filter(makeFilter(filterTags))
            .slice(skip, skip + limit)
            .map(convertTrack)
        }

        return query.offset(skip).limit(limit).all().map(convertTrack)
      },

      getByReleaseId: (releaseId) => {
        return this.db
          .select()
          .from(tracks)
          .where(eq(tracks.releaseId, releaseId))
          .orderBy(tracks.order)
          .all()
          .map(convertTrack)
      },

      getByPlaylistId: (playlistId) => {
        return this.db
          .select()
          .from(tracks)
          .innerJoin(playlistTracks, eq(tracks.id, playlistTracks.trackId))
          .where(eq(playlistTracks.playlistId, playlistId))
          .orderBy(playlistTracks.order)
          .all()
          .map((row) => ({
            ...convertTrack(row.tracks),
            playlistTrackId: row.playlist_tracks.id,
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
    }
  }
