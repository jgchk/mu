import type { InferModel } from 'drizzle-orm'
import { and, eq } from 'drizzle-orm'
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { withProps } from 'utils'

import type { AutoCreatedAt, UpdateData } from '../../utils'
import { hasUpdate, makeUpdate, withCreatedAt } from '../../utils'
import type { DatabaseBase } from '../base'

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

export type SoulseekReleaseDownloadsMixin = {
  soulseekReleaseDownloads: {
    insert: (
      soulseekReleaseDownload: AutoCreatedAt<InsertSoulseekReleaseDownload>
    ) => SoulseekReleaseDownload
    update: (
      id: SoulseekReleaseDownload['id'],
      data: UpdateData<InsertSoulseekReleaseDownload>
    ) => SoulseekReleaseDownload
    get: (id: SoulseekReleaseDownload['id']) => SoulseekReleaseDownload
    getByUsernameAndDir: (
      username: SoulseekReleaseDownload['username'],
      dir: SoulseekReleaseDownload['dir']
    ) => SoulseekReleaseDownload | undefined
    getAll: () => SoulseekReleaseDownload[]
    delete: (id: SoulseekReleaseDownload['id']) => void
  }
}

export const SoulseekReleaseDownloadsMixin = <T extends DatabaseBase>(
  base: T
): T & SoulseekReleaseDownloadsMixin => {
  const soulseekReleaseDownloadsMixin: SoulseekReleaseDownloadsMixin['soulseekReleaseDownloads'] = {
    insert: (soulseekReleaseDownload) => {
      return base.db
        .insert(soulseekReleaseDownloads)
        .values(withCreatedAt(soulseekReleaseDownload))
        .returning()
        .get()
    },

    update: (id, data) => {
      const update = makeUpdate(data)
      if (!hasUpdate(update)) return soulseekReleaseDownloadsMixin.get(id)
      return base.db
        .update(soulseekReleaseDownloads)
        .set(update)
        .where(eq(soulseekReleaseDownloads.id, id))
        .returning()
        .get()
    },

    get: (id) => {
      return base.db
        .select()
        .from(soulseekReleaseDownloads)
        .where(eq(soulseekReleaseDownloads.id, id))
        .get()
    },

    getByUsernameAndDir: (username, dir) => {
      return base.db
        .select()
        .from(soulseekReleaseDownloads)
        .where(
          and(
            eq(soulseekReleaseDownloads.username, username),
            eq(soulseekReleaseDownloads.dir, dir)
          )
        )
        .limit(1)
        .all()
        .at(0)
    },

    getAll: () => {
      return base.db.select().from(soulseekReleaseDownloads).all()
    },

    delete: (id) => {
      return base.db
        .delete(soulseekReleaseDownloads)
        .where(eq(soulseekReleaseDownloads.id, id))
        .run()
    },
  }

  return withProps(base, { soulseekReleaseDownloads: soulseekReleaseDownloadsMixin })
}
