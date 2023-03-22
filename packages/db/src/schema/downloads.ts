import type { InferModel } from 'drizzle-orm/sqlite-core'
import { blob, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import type { FullTrack as SoundcloudFullTrack, Playlist as SoundcloudPlaylist } from 'soundcloud'

export type SoundcloudDownloadStage =
  | 'init'
  | 'fetching-metadata'
  | 'fetched-metadata'
  | 'downloading'
  | 'downloaded'

export type SoundcloudPlaylistDownload = InferModel<typeof soundcloudPlaylistDownloads>
export type InsertSoundcloudPlaylistDownload = InferModel<
  typeof soundcloudPlaylistDownloads,
  'insert'
>
export const soundcloudPlaylistDownloads = sqliteTable(
  'soundcloud_playlist_downloads',
  {
    id: integer('id').primaryKey(),
    playlistId: integer('playlist_id').notNull(),
    playlist: blob<SoundcloudPlaylist>('playlist', { mode: 'json' }),
  },
  (soundcloudPlaylistDownloads) => ({
    playlistIdUniqueIndex: uniqueIndex('playlistIdUniqueIndex').on(
      soundcloudPlaylistDownloads.playlistId
    ),
  })
)

export type SoundcloudTrackDownload = InferModel<typeof soundcloudTrackDownloads>
export type InsertSoundcloudTrackDownload = InferModel<typeof soundcloudTrackDownloads, 'insert'>
export const soundcloudTrackDownloads = sqliteTable(
  'soundcloud_track_downloads',
  {
    id: integer('id').primaryKey(),
    trackId: integer('track_id').notNull(),
    track: blob<SoundcloudFullTrack>('track', { mode: 'json' }),
    path: text('path'),
    progress: integer('progress'),
    playlistDownloadId: integer('playlist_download_id').references(
      () => soundcloudPlaylistDownloads.id
    ),
  },
  (soundcloudTrackDownloads) => ({
    trackIdPlaylistIdUniqueIndex: uniqueIndex('trackIdPlaylistIdUniqueIndex').on(
      soundcloudTrackDownloads.trackId,
      soundcloudTrackDownloads.playlistDownloadId
    ),
  })
)
