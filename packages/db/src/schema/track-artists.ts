import type { InferModel } from 'drizzle-orm'
import { relations } from 'drizzle-orm'
import { integer, primaryKey, sqliteTable } from 'drizzle-orm/sqlite-core'

import { artists } from './artists'
import { tracks } from './tracks'

export type TrackArtist = InferModel<typeof trackArtists>
export type InsertTrackArtist = InferModel<typeof trackArtists, 'insert'>
export const trackArtists = sqliteTable(
  'track_artists',
  {
    trackId: integer('track_id')
      .references(() => tracks.id, { onDelete: 'cascade' })
      .notNull(),
    artistId: integer('artist_id')
      .references(() => artists.id, { onDelete: 'cascade' })
      .notNull(),
    order: integer('order').notNull(),
  },
  (trackArtists) => ({
    trackArtistsPrimaryKey: primaryKey(trackArtists.trackId, trackArtists.artistId),
  })
)

export const trackArtistRelations = relations(trackArtists, ({ one }) => ({
  track: one(tracks, {
    fields: [trackArtists.trackId],
    references: [tracks.id],
  }),
  artist: one(artists, {
    fields: [trackArtists.artistId],
    references: [artists.id],
  }),
}))
