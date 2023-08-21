import { and, eq, isNull } from 'drizzle-orm'
import { ifDefined, withProps } from 'utils'

import type {
  InsertSoulseekTrackDownload,
  SoulseekTrackDownload,
} from '../../schema/downloads/soulseek-track-downloads'
import { soulseekTrackDownloads } from '../../schema/downloads/soulseek-track-downloads'
import type { AutoCreatedAt, UpdateData } from '../../utils'
import { hasUpdate, makeUpdate, withCreatedAt } from '../../utils'
import type { DatabaseBase } from '../base'

export type SoulseekTrackDownloadsMixin = {
  soulseekTrackDownloads: {
    insert: (
      soulseekTrackDownload: AutoCreatedAt<InsertSoulseekTrackDownload>
    ) => SoulseekTrackDownload
    update: (
      id: SoulseekTrackDownload['id'],
      data: UpdateData<InsertSoulseekTrackDownload>
    ) => SoulseekTrackDownload | undefined
    get: (id: SoulseekTrackDownload['id']) => SoulseekTrackDownload | undefined
    getByReleaseDownloadId: (
      releaseDownloadId: SoulseekTrackDownload['releaseDownloadId']
    ) => SoulseekTrackDownload[]
    getByUsernameAndFile: (
      username: SoulseekTrackDownload['username'],
      file: SoulseekTrackDownload['file']
    ) => SoulseekTrackDownload | undefined
    getAll: () => SoulseekTrackDownload[]
    delete: (id: SoulseekTrackDownload['id']) => void
  }
}

export const SoulseekTrackDownloadsMixin = <T extends DatabaseBase>(
  base: T
): T & SoulseekTrackDownloadsMixin => {
  const soulseekTrackDownloadsMixin: SoulseekTrackDownloadsMixin['soulseekTrackDownloads'] = {
    insert: (soulseekTrackDownload) => {
      return base.db
        .insert(soulseekTrackDownloads)
        .values(withCreatedAt(soulseekTrackDownload))
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
      if (!hasUpdate(update)) return soulseekTrackDownloadsMixin.get(id)
      return base.db
        .update(soulseekTrackDownloads)
        .set(update)
        .where(eq(soulseekTrackDownloads.id, id))
        .returning()
        .get()
    },

    get: (id) => {
      return base.db
        .select()
        .from(soulseekTrackDownloads)
        .where(eq(soulseekTrackDownloads.id, id))
        .get()
    },

    getByReleaseDownloadId: (releaseDownloadId) => {
      return base.db
        .select()
        .from(soulseekTrackDownloads)
        .where(
          releaseDownloadId === null
            ? isNull(soulseekTrackDownloads.releaseDownloadId)
            : eq(soulseekTrackDownloads.releaseDownloadId, releaseDownloadId)
        )
        .all()
    },

    getByUsernameAndFile: (username, file) => {
      return base.db
        .select()
        .from(soulseekTrackDownloads)
        .where(
          and(eq(soulseekTrackDownloads.username, username), eq(soulseekTrackDownloads.file, file))
        )
        .limit(1)
        .all()
        .at(0)
    },

    getAll: () => {
      return base.db.select().from(soulseekTrackDownloads).all()
    },

    delete: (id) => {
      return base.db.delete(soulseekTrackDownloads).where(eq(soulseekTrackDownloads.id, id)).run()
    },
  }

  return withProps(base, { soulseekTrackDownloads: soulseekTrackDownloadsMixin })
}
