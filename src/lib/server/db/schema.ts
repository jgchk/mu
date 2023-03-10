import {
  type InferModel,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core'

export const artists = sqliteTable('artists', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
})
export type Artist = InferModel<typeof artists>
export type InsertArtist = InferModel<typeof artists, 'insert'>

export const albums = sqliteTable('albums', {
  id: integer('id').primaryKey(),
  title: text('title').notNull(),
})
export type Album = InferModel<typeof albums>
export type InsertAlbum = InferModel<typeof albums, 'insert'>

export const tracks = sqliteTable(
  'tracks',
  {
    id: integer('id').primaryKey(),
    path: text('path').notNull(),
    title: text('title'),
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

export const downloads = sqliteTable('downloads', {
  id: integer('id').primaryKey(),
  ref: integer('ref').notNull(),
  complete: integer('complete').notNull(),
})
export type Download = InferModel<typeof downloads>
export type InsertDownload = InferModel<typeof downloads, 'insert'>
