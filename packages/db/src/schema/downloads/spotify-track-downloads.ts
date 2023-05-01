import type { InferModel } from 'drizzle-orm'
import { and, eq, isNull } from 'drizzle-orm'
import { blob, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import type { SimplifiedTrack as SpotifySimplifiedTrack } from 'spotify'
import type { Constructor } from 'utils'
import { ifDefined } from 'utils'

import type { DownloadStatus } from '.'
import type { AutoCreatedAt, UpdateData } from '../../utils'
import { hasUpdate, makeUpdate, withCreatedAt } from '../../utils'
import type { DatabaseBase } from '../base'
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

export type SpotifyTrackDownloadsMixin = {
  spotifyTrackDownloads: {
    insert: (
      spotifyTrackDownload: AutoCreatedAt<InsertSpotifyTrackDownload>
    ) => SpotifyTrackDownload
    update: (
      id: SpotifyTrackDownload['id'],
      data: UpdateData<InsertSpotifyTrackDownload>
    ) => SpotifyTrackDownload
    get: (id: SpotifyTrackDownload['id']) => SpotifyTrackDownload
    getByAlbumDownloadId: (
      albumDownloadId: SpotifyTrackDownload['albumDownloadId']
    ) => SpotifyTrackDownload[]
    getByTrackIdAndAlbumDownloadId: (
      trackId: SpotifyTrackDownload['trackId'],
      albumDownloadId: SpotifyTrackDownload['albumDownloadId']
    ) => SpotifyTrackDownload | undefined
    getAll: () => SpotifyTrackDownload[]
    delete: (id: SpotifyTrackDownload['id']) => void
  }
}

export const SpotifyTrackDownloadsMixin = <TBase extends Constructor<DatabaseBase>>(
  Base: TBase
): Constructor<SpotifyTrackDownloadsMixin> & TBase =>
  class extends Base implements SpotifyTrackDownloadsMixin {
    spotifyTrackDownloads: SpotifyTrackDownloadsMixin['spotifyTrackDownloads'] = {
      insert: (spotifyTrackDownload: AutoCreatedAt<InsertSpotifyTrackDownload>) => {
        return this.db
          .insert(spotifyTrackDownloads)
          .values(withCreatedAt(spotifyTrackDownload))
          .returning()
          .get()
      },

      update: (id: SpotifyTrackDownload['id'], data: UpdateData<InsertSpotifyTrackDownload>) => {
        const update = makeUpdate({
          ...data,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          error: ifDefined(data.error, (error) =>
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return
            JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error)))
          ),
        })
        if (!hasUpdate(update)) return this.spotifyTrackDownloads.get(id)
        return this.db
          .update(spotifyTrackDownloads)
          .set(update)
          .where(eq(spotifyTrackDownloads.id, id))
          .returning()
          .get()
      },

      get: (id: SpotifyTrackDownload['id']) => {
        return this.db
          .select()
          .from(spotifyTrackDownloads)
          .where(eq(spotifyTrackDownloads.id, id))
          .get()
      },

      getByAlbumDownloadId: (albumDownloadId: SpotifyTrackDownload['albumDownloadId']) => {
        return this.db
          .select()
          .from(spotifyTrackDownloads)
          .where(
            albumDownloadId === null
              ? isNull(spotifyTrackDownloads.albumDownloadId)
              : eq(spotifyTrackDownloads.albumDownloadId, albumDownloadId)
          )
          .all()
      },

      getByTrackIdAndAlbumDownloadId: (
        trackId: SpotifyTrackDownload['trackId'],
        albumDownloadId: SpotifyTrackDownload['albumDownloadId']
      ) => {
        return this.db
          .select()
          .from(spotifyTrackDownloads)
          .where(
            and(
              eq(spotifyTrackDownloads.trackId, trackId),
              albumDownloadId === null
                ? isNull(spotifyTrackDownloads.albumDownloadId)
                : eq(spotifyTrackDownloads.albumDownloadId, albumDownloadId)
            )
          )
          .limit(1)
          .all()
          .at(0)
      },

      getAll: () => {
        return this.db.select().from(spotifyTrackDownloads).all()
      },

      delete: (id: SpotifyTrackDownload['id']) => {
        return this.db.delete(spotifyTrackDownloads).where(eq(spotifyTrackDownloads.id, id)).run()
      },
    }
  }
