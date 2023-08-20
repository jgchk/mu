import { eq } from 'drizzle-orm'
import { withProps } from 'utils'

import type {
  InsertSpotifyAlbumDownload,
  SpotifyAlbumDownload,
} from '../../schema/downloads/spotify-album-downloads'
import { spotifyAlbumDownloads } from '../../schema/downloads/spotify-album-downloads'
import type { AutoCreatedAt, UpdateData } from '../../utils'
import { hasUpdate, makeUpdate, withCreatedAt } from '../../utils'
import type { DatabaseBase } from '../base'

export type SpotifyAlbumDownloadsMixin = {
  spotifyAlbumDownloads: {
    insert: (
      spotifyAlbumDownload: AutoCreatedAt<InsertSpotifyAlbumDownload>
    ) => SpotifyAlbumDownload
    update: (
      id: SpotifyAlbumDownload['id'],
      data: UpdateData<InsertSpotifyAlbumDownload>
    ) => SpotifyAlbumDownload | undefined
    get: (id: SpotifyAlbumDownload['id']) => SpotifyAlbumDownload | undefined
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
