import type { InferModel } from 'drizzle-orm'
import { and, eq, isNull } from 'drizzle-orm'
import { blob, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import type { Constructor } from 'utils'

import type { AutoCreatedAt, UpdateData } from '../../utils'
import { makeUpdate, withCreatedAt } from '../../utils'
import type { DatabaseBase } from '../base'
import type { DownloadStatus } from '.'
import { soulseekReleaseDownloads } from './soulseek-release-downloads'

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
export type SoulseekTrackDownloadsMixin = {
  soulseekTrackDownloads: {
    insert: (
      soulseekTrackDownload: AutoCreatedAt<InsertSoulseekTrackDownload>
    ) => SoulseekTrackDownload
    update: (
      id: SoulseekTrackDownload['id'],
      data: UpdateData<InsertSoulseekTrackDownload>
    ) => SoulseekTrackDownload
    get: (id: SoulseekTrackDownload['id']) => SoulseekTrackDownload
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

export const SoulseekTrackDownloadsMixin = <TBase extends Constructor<DatabaseBase>>(
  Base: TBase
): Constructor<SoulseekTrackDownloadsMixin> & TBase =>
  class extends Base implements SoulseekTrackDownloadsMixin {
    soulseekTrackDownloads: SoulseekTrackDownloadsMixin['soulseekTrackDownloads'] = {
      insert: (soulseekTrackDownload) => {
        return this.db
          .insert(soulseekTrackDownloads)
          .values(withCreatedAt(soulseekTrackDownload))
          .returning()
          .get()
      },

      update: (id, data) => {
        return this.db
          .update(soulseekTrackDownloads)
          .set(makeUpdate(data))
          .where(eq(soulseekTrackDownloads.id, id))
          .returning()
          .get()
      },

      get: (id) => {
        return this.db
          .select()
          .from(soulseekTrackDownloads)
          .where(eq(soulseekTrackDownloads.id, id))
          .get()
      },

      getByReleaseDownloadId: (releaseDownloadId) => {
        return this.db
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
        return this.db
          .select()
          .from(soulseekTrackDownloads)
          .where(
            and(
              eq(soulseekTrackDownloads.username, username),
              eq(soulseekTrackDownloads.file, file)
            )
          )
          .limit(1)
          .all()
          .at(0)
      },

      getAll: () => {
        return this.db.select().from(soulseekTrackDownloads).all()
      },

      delete: (id) => {
        return this.db.delete(soulseekTrackDownloads).where(eq(soulseekTrackDownloads.id, id)).run()
      },
    }
  }
