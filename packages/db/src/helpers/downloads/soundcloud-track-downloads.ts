import { and, eq, isNull } from 'drizzle-orm'
import { ifDefined, withProps } from 'utils'

import type {
  InsertSoundcloudTrackDownload,
  SoundcloudTrackDownload,
} from '../../schema/downloads/soundcloud-track-downloads'
import { soundcloudTrackDownloads } from '../../schema/downloads/soundcloud-track-downloads'
import type { AutoCreatedAt, UpdateData } from '../../utils'
import { hasUpdate, makeUpdate, withCreatedAt } from '../../utils'
import type { DatabaseBase } from '../base'

export type SoundcloudTrackDownloadsMixin = {
  soundcloudTrackDownloads: {
    insert: (
      soundcloudTrackDownload: AutoCreatedAt<InsertSoundcloudTrackDownload>
    ) => SoundcloudTrackDownload
    update: (
      id: SoundcloudTrackDownload['id'],
      data: UpdateData<InsertSoundcloudTrackDownload>
    ) => SoundcloudTrackDownload | undefined
    get: (id: SoundcloudTrackDownload['id']) => SoundcloudTrackDownload | undefined
    getByPlaylistDownloadId: (
      playlistDownloadId: SoundcloudTrackDownload['playlistDownloadId']
    ) => SoundcloudTrackDownload[]
    getByTrackIdAndPlaylistDownloadId: (
      trackId: SoundcloudTrackDownload['trackId'],
      playlistDownloadId: SoundcloudTrackDownload['playlistDownloadId']
    ) => SoundcloudTrackDownload | undefined
    getAll: () => SoundcloudTrackDownload[]
    delete: (id: SoundcloudTrackDownload['id']) => void
  }
}

export const SoundcloudTrackDownloadsMixin = <T extends DatabaseBase>(
  base: T
): T & SoundcloudTrackDownloadsMixin => {
  const soundcloudTrackDownloadsMixin: SoundcloudTrackDownloadsMixin['soundcloudTrackDownloads'] = {
    insert: (soundcloudTrackDownload) => {
      return base.db
        .insert(soundcloudTrackDownloads)
        .values(withCreatedAt(soundcloudTrackDownload))
        .returning()
        .get()
    },

    update: (id, data) => {
      const update = makeUpdate({
        ...data,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        error: ifDefined(data.error, (error) =>
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error)))
        ),
      })
      if (!hasUpdate(update)) return soundcloudTrackDownloadsMixin.get(id)
      return base.db
        .update(soundcloudTrackDownloads)
        .set(update)
        .where(eq(soundcloudTrackDownloads.id, id))
        .returning()
        .get()
    },

    get: (id) => {
      return base.db
        .select()
        .from(soundcloudTrackDownloads)
        .where(eq(soundcloudTrackDownloads.id, id))
        .get()
    },

    getByPlaylistDownloadId: (playlistDownloadId) => {
      return base.db
        .select()
        .from(soundcloudTrackDownloads)
        .where(
          playlistDownloadId === null
            ? isNull(soundcloudTrackDownloads.playlistDownloadId)
            : eq(soundcloudTrackDownloads.playlistDownloadId, playlistDownloadId)
        )
        .all()
    },

    getByTrackIdAndPlaylistDownloadId: (trackId, playlistDownloadId) => {
      return base.db
        .select()
        .from(soundcloudTrackDownloads)
        .where(
          and(
            eq(soundcloudTrackDownloads.trackId, trackId),
            playlistDownloadId === null
              ? isNull(soundcloudTrackDownloads.playlistDownloadId)
              : eq(soundcloudTrackDownloads.playlistDownloadId, playlistDownloadId)
          )
        )
        .limit(1)
        .all()
        .at(0)
    },

    getAll: () => {
      return base.db.select().from(soundcloudTrackDownloads).all()
    },

    delete: (id) => {
      return base.db
        .delete(soundcloudTrackDownloads)
        .where(eq(soundcloudTrackDownloads.id, id))
        .run()
    },
  }

  return withProps(base, { soundcloudTrackDownloads: soundcloudTrackDownloadsMixin })
}
