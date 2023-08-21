import { eq } from 'drizzle-orm'
import { withProps } from 'utils'

import type {
  InsertSoundcloudPlaylistDownload,
  SoundcloudPlaylistDownload,
} from '../../schema/downloads/soundcloud-playlist-downloads'
import { soundcloudPlaylistDownloads } from '../../schema/downloads/soundcloud-playlist-downloads'
import type { AutoCreatedAt, UpdateData } from '../../utils'
import { hasUpdate, makeUpdate, withCreatedAt } from '../../utils'
import type { DatabaseBase } from '../base'

export type SoundcloudPlaylistDownloadsMixin = {
  soundcloudPlaylistDownloads: {
    insert: (
      soundcloudPlaylistDownload: AutoCreatedAt<InsertSoundcloudPlaylistDownload>
    ) => SoundcloudPlaylistDownload
    update: (
      id: SoundcloudPlaylistDownload['id'],
      data: UpdateData<InsertSoundcloudPlaylistDownload>
    ) => SoundcloudPlaylistDownload | undefined
    get: (id: SoundcloudPlaylistDownload['id']) => SoundcloudPlaylistDownload | undefined
    getByPlaylistId: (
      playlistId: SoundcloudPlaylistDownload['playlistId']
    ) => SoundcloudPlaylistDownload | undefined
    getAll: () => SoundcloudPlaylistDownload[]
    delete: (id: SoundcloudPlaylistDownload['id']) => void
  }
}

export const SoundcloudPlaylistDownloadsMixin = <T extends DatabaseBase>(
  base: T
): T & SoundcloudPlaylistDownloadsMixin => {
  const soundcloudPlaylistDownloadsMixin: SoundcloudPlaylistDownloadsMixin['soundcloudPlaylistDownloads'] =
    {
      insert: (soundcloudPlaylistDownload) => {
        return base.db
          .insert(soundcloudPlaylistDownloads)
          .values(withCreatedAt(soundcloudPlaylistDownload))
          .returning()
          .get()
      },

      update: (id, data) => {
        const update = makeUpdate(data)
        if (!hasUpdate(update)) return soundcloudPlaylistDownloadsMixin.get(id)
        return base.db
          .update(soundcloudPlaylistDownloads)
          .set(update)
          .where(eq(soundcloudPlaylistDownloads.id, id))
          .returning()
          .get()
      },

      get: (id) => {
        return base.db
          .select()
          .from(soundcloudPlaylistDownloads)
          .where(eq(soundcloudPlaylistDownloads.id, id))
          .get()
      },

      getByPlaylistId: (playlistId) => {
        return base.db
          .select()
          .from(soundcloudPlaylistDownloads)
          .where(eq(soundcloudPlaylistDownloads.playlistId, playlistId))
          .limit(1)
          .all()
          .at(0)
      },

      getAll: () => {
        return base.db.select().from(soundcloudPlaylistDownloads).all()
      },

      delete: (id) => {
        return base.db
          .delete(soundcloudPlaylistDownloads)
          .where(eq(soundcloudPlaylistDownloads.id, id))
          .run()
      },
    }

  return withProps(base, { soundcloudPlaylistDownloads: soundcloudPlaylistDownloadsMixin })
}
