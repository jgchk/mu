import type { InferModel } from 'drizzle-orm'
import { integer, primaryKey, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

import { images } from './images'

export type Artist = InferModel<typeof artists>
export type InsertArtist = InferModel<typeof artists, 'insert'>
export const artists = sqliteTable('artists', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
})

export type Release = InferModel<typeof releases>
export type InsertRelease = InferModel<typeof releases, 'insert'>
export const releases = sqliteTable('releases', {
  id: integer('id').primaryKey(),
  title: text('title'),
})

export type ReleaseArtist = InferModel<typeof releaseArtists>
export type InsertReleaseArtist = InferModel<typeof releaseArtists, 'insert'>
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

export type Track = InferModel<typeof tracks>
export type InsertTrack = InferModel<typeof tracks, 'insert'>
export const tracks = sqliteTable(
  'tracks',
  {
    id: integer('id').primaryKey(),
    path: text('path').notNull(),
    title: text('title'),
    releaseId: integer('release_id').references(() => releases.id),
    trackNumber: integer('track_number'),
    duration: integer('duration').notNull(),
    favorite: integer('favorite').notNull(),
    imageId: integer('image_id').references(() => images.id),
  },
  (tracks) => ({
    pathUniqueIndex: uniqueIndex('pathUniqueIndex').on(tracks.path),
  })
)

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

export type Playlist = InferModel<typeof playlists>
export type InsertPlaylist = InferModel<typeof playlists, 'insert'>
export const playlists = sqliteTable('playlists', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export type PlaylistTrack = InferModel<typeof playlistTracks>
export type InsertPlaylistTrack = InferModel<typeof playlistTracks, 'insert'>
export const playlistTracks = sqliteTable('playlist_tracks', {
  id: integer('id').primaryKey(),
  playlistId: integer('playlist_id')
    .references(() => playlists.id)
    .notNull(),
  trackId: integer('track_id')
    .references(() => tracks.id)
    .notNull(),
  order: integer('order').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})
