import type { InferModel } from 'drizzle-orm'
import { blob, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import type { FullTrack as SoundcloudFullTrack, Playlist as SoundcloudPlaylist } from 'soundcloud'
import type {
  FullAlbum as SpotifyFullAlbum,
  SimplifiedTrack as SpotifySimplifiedTrack,
} from 'spotify'

export type DownloadStatus = 'pending' | 'downloading' | 'done' | 'error'

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
    playlist: blob('playlist', { mode: 'json' }).$type<SoundcloudPlaylist>(),
    error: blob('error', { mode: 'json' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
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
    track: blob('track', { mode: 'json' }).$type<SoundcloudFullTrack>(),
    path: text('path'),
    status: text('status').$type<DownloadStatus>().notNull(),
    progress: integer('progress'),
    error: blob('error', { mode: 'json' }),
    playlistDownloadId: integer('playlist_download_id').references(
      () => soundcloudPlaylistDownloads.id
    ),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  },
  (soundcloudTrackDownloads) => ({
    trackIdPlaylistIdUniqueIndex: uniqueIndex('trackIdPlaylistIdUniqueIndex').on(
      soundcloudTrackDownloads.trackId,
      soundcloudTrackDownloads.playlistDownloadId
    ),
  })
)

export type SpotifyAlbumDownload = InferModel<typeof spotifyAlbumDownloads>
export type InsertSpotifyAlbumDownload = InferModel<typeof spotifyAlbumDownloads, 'insert'>
export const spotifyAlbumDownloads = sqliteTable(
  'spotify_album_downloads',
  {
    id: integer('id').primaryKey(),
    albumId: text('album_id').notNull(),
    album: blob('album', { mode: 'json' }).$type<SpotifyFullAlbum>(),
    error: blob('error', { mode: 'json' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  },
  (spotifyAlbumDownloads) => ({
    albumIdUniqueIndex: uniqueIndex('albumIdUniqueIndex').on(spotifyAlbumDownloads.albumId),
  })
)

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

export type SoulseekReleaseDownload = InferModel<typeof soulseekReleaseDownloads>
export type InsertSoulseekReleaseDownload = InferModel<typeof soulseekReleaseDownloads, 'insert'>
export const soulseekReleaseDownloads = sqliteTable(
  'soulseek_release_downloads',
  {
    id: integer('id').primaryKey(),
    username: text('username').notNull(),
    dir: text('name').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  },
  (soulseekReleaseDownloads) => ({
    usernameDirUniqueIndex: uniqueIndex('usernameDirUniqueIndex').on(
      soulseekReleaseDownloads.username,
      soulseekReleaseDownloads.dir
    ),
  })
)

export type SoulseekTrackDownload = InferModel<typeof soulseekTrackDownloads>
export type InsertSoulseekTrackDownload = InferModel<typeof soulseekTrackDownloads, 'insert'>
export const soulseekTrackDownloads = sqliteTable(
  'soulseek_track_downloads',
  {
    id: integer('id').primaryKey(),
    username: text('username').notNull(),
    file: text('file').notNull(),
    path: text('path'),
    status: text('status').$type<DownloadStatus>().notNull(),
    progress: integer('progress'),
    error: blob('error', { mode: 'json' }),
    releaseDownloadId: integer('release_download_id').references(() => soulseekReleaseDownloads.id),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  },
  (soulseekTrackDownloads) => ({
    usernameFileUniqueIndex: uniqueIndex('usernameFileUniqueIndex').on(
      soulseekTrackDownloads.username,
      soulseekTrackDownloads.file
    ),
    usernameFileReleaseDownloadIdUniqueIndex: uniqueIndex(
      'usernameFileReleaseDownloadIdUniqueIndex'
    ).on(
      soulseekTrackDownloads.username,
      soulseekTrackDownloads.file,
      soulseekTrackDownloads.releaseDownloadId
    ),
  })
)
