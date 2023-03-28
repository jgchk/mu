import type { InferModel } from 'drizzle-orm'
import { integer, primaryKey, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

export * from './downloads'

export const artists = sqliteTable('artists', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
})
export type Artist = InferModel<typeof artists>
export type InsertArtist = InferModel<typeof artists, 'insert'>

export const releases = sqliteTable('releases', {
  id: integer('id').primaryKey(),
  title: text('title'),
})
export type Release = InferModel<typeof releases>
export type InsertRelease = InferModel<typeof releases, 'insert'>

export const releaseArtists = sqliteTable(
  'release_artists',
  {
    releaseId: integer('release_id')
      .references(() => releases.id)
      .notNull(),
    artistId: integer('artist_id')
      .references(() => artists.id)
      .notNull(),
    order: integer('order').notNull(),
  },
  (releaseArtists) => ({
    releaseArtistsPrimaryKey: primaryKey(releaseArtists.releaseId, releaseArtists.artistId),
  })
)
export type ReleaseArtist = InferModel<typeof releaseArtists>
export type InsertReleaseArtist = InferModel<typeof releaseArtists, 'insert'>

export const tracks = sqliteTable(
  'tracks',
  {
    id: integer('id').primaryKey(),
    path: text('path').notNull(),
    title: text('title'),
    releaseId: integer('release_id').references(() => releases.id),
    trackNumber: integer('track_number'),
    hasCoverArt: integer('has_cover_art').notNull(),
  },
  (tracks) => ({
    pathUniqueIndex: uniqueIndex('pathUniqueIndex').on(tracks.path),
  })
)
export type Track = InferModel<typeof tracks>
export type InsertTrack = InferModel<typeof tracks, 'insert'>

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
export type TrackArtist = InferModel<typeof trackArtists>
export type InsertTrackArtist = InferModel<typeof trackArtists, 'insert'>

export type TrackPretty = Omit<Track, 'hasCoverArt'> & { hasCoverArt: boolean }
export type InsertTrackPretty = Omit<InsertTrack, 'hasCoverArt'> & { hasCoverArt: boolean }

export const convertInsertTrack = (track: InsertTrackPretty): InsertTrack => ({
  ...track,
  hasCoverArt: track.hasCoverArt ? 1 : 0,
})
export const convertTrack = (track: Track): TrackPretty => ({
  ...track,
  hasCoverArt: track.hasCoverArt !== 0,
})
