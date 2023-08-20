import { and, eq, isNull } from 'drizzle-orm'
import { ifDefined, withProps } from 'utils'

import type {
  InsertSpotifyTrackDownload,
  SpotifyTrackDownload,
} from '../../schema/downloads/spotify-track-downloads'
import { spotifyTrackDownloads } from '../../schema/downloads/spotify-track-downloads'
import type { AutoCreatedAt, UpdateData } from '../../utils'
import { hasUpdate, makeUpdate, withCreatedAt } from '../../utils'
import type { DatabaseBase } from '../base'

export type SpotifyTrackDownloadsMixin = {
  spotifyTrackDownloads: {
    insert: (
      spotifyTrackDownload: AutoCreatedAt<InsertSpotifyTrackDownload>
    ) => SpotifyTrackDownload
    update: (
      id: SpotifyTrackDownload['id'],
      data: UpdateData<InsertSpotifyTrackDownload>
    ) => SpotifyTrackDownload | undefined
    get: (id: SpotifyTrackDownload['id']) => SpotifyTrackDownload | undefined
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

export const SpotifyTrackDownloadsMixin = <T extends DatabaseBase>(
  base: T
): T & SpotifyTrackDownloadsMixin => {
  const spotifyTrackDownloadsMixin: SpotifyTrackDownloadsMixin['spotifyTrackDownloads'] = {
    insert: (spotifyTrackDownload: AutoCreatedAt<InsertSpotifyTrackDownload>) => {
      return base.db
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
      if (!hasUpdate(update)) return spotifyTrackDownloadsMixin.get(id)
      return base.db
        .update(spotifyTrackDownloads)
        .set(update)
        .where(eq(spotifyTrackDownloads.id, id))
        .returning()
        .get()
    },

    get: (id: SpotifyTrackDownload['id']) => {
      return base.db
        .select()
        .from(spotifyTrackDownloads)
        .where(eq(spotifyTrackDownloads.id, id))
        .get()
    },

    getByAlbumDownloadId: (albumDownloadId: SpotifyTrackDownload['albumDownloadId']) => {
      return base.db
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
      return base.db
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
      return base.db.select().from(spotifyTrackDownloads).all()
    },

    delete: (id: SpotifyTrackDownload['id']) => {
      return base.db.delete(spotifyTrackDownloads).where(eq(spotifyTrackDownloads.id, id)).run()
    },
  }

  return withProps(base, { spotifyTrackDownloads: spotifyTrackDownloadsMixin })
}
