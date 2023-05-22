import type { InferModel } from 'drizzle-orm'
import { eq } from 'drizzle-orm'
import { blob, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import type { FullAlbum as SpotifyFullAlbum } from 'spotify'
import { withProps } from 'utils'

import type { AutoCreatedAt, UpdateData } from '../../utils'
import { hasUpdate, makeUpdate, withCreatedAt } from '../../utils'
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

export const SpotifyAlbumDownloadsMixin = <T extends DatabaseBase>(
  base: T
): T & SpotifyAlbumDownloadsMixin => {
  const spotifyAlbumDownloadsMixin: SpotifyAlbumDownloadsMixin['spotifyAlbumDownloads'] = {
    insert: (spotifyAlbumDownload) => {
      return base.db
        .insert(spotifyAlbumDownloads)
        .values(withCreatedAt(spotifyAlbumDownload))
        .returning()
        .get()
    },

    update: (id, data) => {
      const update = makeUpdate(data)
      if (!hasUpdate(update)) return spotifyAlbumDownloadsMixin.get(id)
      return base.db
        .update(spotifyAlbumDownloads)
        .set(update)
        .where(eq(spotifyAlbumDownloads.id, id))
        .returning()
        .get()
    },

    get: (id) => {
      return base.db
        .select()
        .from(spotifyAlbumDownloads)
        .where(eq(spotifyAlbumDownloads.id, id))
        .get()
    },

    getByAlbumId: (albumId) => {
      return base.db
        .select()
        .from(spotifyAlbumDownloads)
        .where(eq(spotifyAlbumDownloads.albumId, albumId))
        .limit(1)
        .all()
        .at(0)
    },

    getAll: () => {
      return base.db.select().from(spotifyAlbumDownloads).all()
    },

    delete: (id) => {
      return base.db.delete(spotifyAlbumDownloads).where(eq(spotifyAlbumDownloads.id, id)).run()
    },
  }

  return withProps(base, { spotifyAlbumDownloads: spotifyAlbumDownloadsMixin })
}
