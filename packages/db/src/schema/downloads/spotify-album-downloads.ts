import type { InferModel } from 'drizzle-orm'
import { eq } from 'drizzle-orm'
import { blob, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import type { FullAlbum as SpotifyFullAlbum } from 'spotify'
import type { Constructor } from 'utils'

import type { AutoCreatedAt, UpdateData } from '../../utils'
import { makeUpdate, withCreatedAt } from '../../utils'
import type { DatabaseBase } from '../base'

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

export type SpotifyAlbumDownloadsMixin = {
  spotifyAlbumDownloads: {
    insert: (
      spotifyAlbumDownload: AutoCreatedAt<InsertSpotifyAlbumDownload>
    ) => SpotifyAlbumDownload
    update: (
      id: SpotifyAlbumDownload['id'],
      data: UpdateData<InsertSpotifyAlbumDownload>
    ) => SpotifyAlbumDownload
    get: (id: SpotifyAlbumDownload['id']) => SpotifyAlbumDownload
    getByAlbumId: (albumId: SpotifyAlbumDownload['albumId']) => SpotifyAlbumDownload | undefined
    getAll: () => SpotifyAlbumDownload[]
    delete: (id: SpotifyAlbumDownload['id']) => void
  }
}

export const SpotifyAlbumDownloadsMixin = <TBase extends Constructor<DatabaseBase>>(
  Base: TBase
): Constructor<SpotifyAlbumDownloadsMixin> & TBase =>
  class extends Base implements SpotifyAlbumDownloadsMixin {
    spotifyAlbumDownloads: SpotifyAlbumDownloadsMixin['spotifyAlbumDownloads'] = {
      insert: (spotifyAlbumDownload) => {
        return this.db
          .insert(spotifyAlbumDownloads)
          .values(withCreatedAt(spotifyAlbumDownload))
          .returning()
          .get()
      },

      update: (id, data) => {
        return this.db
          .update(spotifyAlbumDownloads)
          .set(makeUpdate(data))
          .where(eq(spotifyAlbumDownloads.id, id))
          .returning()
          .get()
      },

      get: (id) => {
        return this.db
          .select()
          .from(spotifyAlbumDownloads)
          .where(eq(spotifyAlbumDownloads.id, id))
          .get()
      },

      getByAlbumId: (albumId) => {
        return this.db
          .select()
          .from(spotifyAlbumDownloads)
          .where(eq(spotifyAlbumDownloads.albumId, albumId))
          .limit(1)
          .all()
          .at(0)
      },

      getAll: () => {
        return this.db.select().from(spotifyAlbumDownloads).all()
      },

      delete: (id) => {
        return this.db.delete(spotifyAlbumDownloads).where(eq(spotifyAlbumDownloads.id, id)).run()
      },
    }
  }
