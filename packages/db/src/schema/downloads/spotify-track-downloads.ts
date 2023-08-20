import type { InferModel } from 'drizzle-orm'
import { blob, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import type { SimplifiedTrack as SpotifySimplifiedTrack } from 'spotify'

import type { DownloadStatus } from '.'
import { spotifyAlbumDownloads } from './spotify-album-downloads'

export type SpotifyTrackDownload = InferModel<typeof spotifyTrackDownloads>
export type InsertSpotifyTrackDownload = InferModel<typeof spotifyTrackDownloads, 'insert'>
export const spotifyTrackDownloads = sqliteTable(
  'spotify_track_downloads',
  {
    id: integer('id').primaryKey(),
    trackId: text('track_id').notNull(),
    track: blob('track', { mode: 'json' }).$type<SpotifySimplifiedTrack>(),
    path: text('path'),
    status: text('status').$type<DownloadStatus>().notNull(),
    progress: integer('progress'),
    error: blob('error', { mode: 'json' }),
    albumDownloadId: integer('album_download_id').references(() => spotifyAlbumDownloads.id),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  },
  (spotifyTrackDownloads) => ({
    trackIdAlbumIdUniqueIndex: uniqueIndex('trackIdAlbumIdUniqueIndex').on(
      spotifyTrackDownloads.trackId,
      spotifyTrackDownloads.albumDownloadId
    ),
  })
)
