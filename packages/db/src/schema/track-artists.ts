import type { InferModel } from 'drizzle-orm'
import { eq } from 'drizzle-orm'
import { integer, primaryKey, sqliteTable } from 'drizzle-orm/sqlite-core'
import type { Constructor } from 'utils'

import { artists } from './artists'
import type { DatabaseBase } from './base'
import { tracks } from './tracks'

export type TrackArtist = InferModel<typeof trackArtists>
export type InsertTrackArtist = InferModel<typeof trackArtists, 'insert'>
export const trackArtists = sqliteTable(
  'track_artists',
  {
    trackId: integer('track_id')
      .references(() => tracks.id)
      .notNull(),
    artistId: integer('artist_id')
      .references(() => artists.id)
      .notNull(),
    order: integer('order').notNull(),
  },
  (trackArtists) => ({
    trackArtistsPrimaryKey: primaryKey(trackArtists.trackId, trackArtists.artistId),
  })
)

export type TrackArtistsMixin = {
  trackArtists: {
    insertMany: (trackArtists: InsertTrackArtist[]) => TrackArtist[]
    insertManyByTrackId: (
      trackId: TrackArtist['trackId'],
      artistIds: TrackArtist['artistId'][]
    ) => TrackArtist[]
    updateByTrackId: (
      trackId: TrackArtist['trackId'],
      artistIds: TrackArtist['artistId'][]
    ) => TrackArtist[]
    getByTrackId: (trackId: TrackArtist['trackId']) => TrackArtist[]
    deleteByTrackId: (trackId: TrackArtist['trackId']) => void
  }
}

export const TrackArtistsMixin = <TBase extends Constructor<DatabaseBase>>(
  Base: TBase
): Constructor<TrackArtistsMixin> & TBase =>
  class extends Base implements TrackArtistsMixin {
    trackArtists: TrackArtistsMixin['trackArtists'] = {
      insertMany: (trackArtists_) => {
        if (trackArtists_.length === 0) return []
        return this.db.insert(trackArtists).values(trackArtists_).returning().all()
      },

      insertManyByTrackId: (trackId, artistIds) => {
        return this.trackArtists.insertMany(
          artistIds.map((artistId, order) => ({
            trackId,
            artistId,
            order,
          }))
        )
      },

      updateByTrackId: (trackId, artistIds) => {
        this.trackArtists.deleteByTrackId(trackId)
        return this.trackArtists.insertManyByTrackId(trackId, artistIds)
      },

      getByTrackId: (trackId) => {
        return this.db.select().from(trackArtists).where(eq(trackArtists.trackId, trackId)).all()
      },

      deleteByTrackId: (trackId) => {
        return this.db.delete(trackArtists).where(eq(trackArtists.trackId, trackId)).run()
      },
    }
  }
