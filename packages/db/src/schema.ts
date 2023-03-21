import type { InferModel } from 'drizzle-orm/sqlite-core';
import { blob, integer, primaryKey, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const artists = sqliteTable('artists', {
  id: integer('id').primaryKey(),
  name: text('name').notNull()
});
export type Artist = InferModel<typeof artists>;
export type InsertArtist = InferModel<typeof artists, 'insert'>;

export const releases = sqliteTable('releases', {
  id: integer('id').primaryKey(),
  title: text('title')
});
export type Release = InferModel<typeof releases>;
export type InsertRelease = InferModel<typeof releases, 'insert'>;

export const releaseArtists = sqliteTable(
  'release_artists',
  {
    releaseId: integer('release_id')
      .references(() => releases.id)
      .notNull(),
    artistId: integer('artist_id')
      .references(() => artists.id)
      .notNull(),
    order: integer('order').notNull()
  },
  (releaseArtists) => ({
    releaseArtistsPrimaryKey: primaryKey(releaseArtists.releaseId, releaseArtists.artistId)
  })
);
export type ReleaseArtist = InferModel<typeof releaseArtists>;
export type InsertReleaseArtist = InferModel<typeof releaseArtists, 'insert'>;

export const tracks = sqliteTable(
  'tracks',
  {
    id: integer('id').primaryKey(),
    path: text('path').notNull(),
    title: text('title'),
    releaseId: integer('release_id').references(() => releases.id),
    trackNumber: text('track_number'),
    hasCoverArt: integer('has_cover_art').notNull()
  },
  (tracks) => ({
    pathUniqueIndex: uniqueIndex('pathUniqueIndex').on(tracks.path)
  })
);
export type Track = InferModel<typeof tracks>;
export type InsertTrack = InferModel<typeof tracks, 'insert'>;

export const trackArtists = sqliteTable(
  'track_artists',
  {
    trackId: integer('track_id')
      .references(() => tracks.id)
      .notNull(),
    artistId: integer('artist_id')
      .references(() => artists.id)
      .notNull(),
    order: integer('order').notNull()
  },
  (trackArtists) => ({
    trackArtistsPrimaryKey: primaryKey(trackArtists.trackId, trackArtists.artistId)
  })
);
export type TrackArtist = InferModel<typeof trackArtists>;
export type InsertTrackArtist = InferModel<typeof trackArtists, 'insert'>;

export const releaseDownloads = sqliteTable('release_downloads', {
  id: integer('id').primaryKey(),
  name: text('name')
});
export type ReleaseDownload = InferModel<typeof releaseDownloads>;
export type InsertReleaseDownload = InferModel<typeof releaseDownloads, 'insert'>;

export const trackDownloads = sqliteTable('track_downloads', {
  id: integer('id').primaryKey(),
  service: text<'spotify' | 'soundcloud' | 'soulseek'>('service').notNull(),
  serviceId: blob<number | string>('service_id', { mode: 'json' }).notNull(),
  complete: integer('complete').notNull(),
  name: text('name'),
  path: text('path'),
  releaseDownloadId: integer('release_download_id').references(() => releaseDownloads.id)
});
export type TrackDownload = InferModel<typeof trackDownloads>;
export type InsertTrackDownload = InferModel<typeof trackDownloads, 'insert'>;

export type TrackDownloadPretty = Omit<TrackDownload, 'complete'> & { complete: boolean };
export type InsertTrackDownloadPretty = Omit<InsertTrackDownload, 'complete'> & {
  complete: boolean;
};

export const convertInsertTrackDownload = (
  trackDownload: InsertTrackDownloadPretty
): InsertTrackDownload => ({
  ...trackDownload,
  complete: trackDownload.complete ? 1 : 0
});

export const convertTrackDownload = (trackDownload: TrackDownload): TrackDownloadPretty => ({
  ...trackDownload,
  complete: !!trackDownload.complete
});

export type TrackPretty = Omit<Track, 'hasCoverArt'> & { hasCoverArt: boolean };
export type InsertTrackPretty = Omit<InsertTrack, 'hasCoverArt'> & { hasCoverArt: boolean };

export const convertInsertTrack = (track: InsertTrackPretty): InsertTrack => ({
  ...track,
  hasCoverArt: track.hasCoverArt ? 1 : 0
});
export const convertTrack = (track: Track): TrackPretty => ({
  ...track,
  hasCoverArt: track.hasCoverArt !== 0
});
