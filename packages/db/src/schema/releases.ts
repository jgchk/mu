import type { InferModel } from 'drizzle-orm'
import { eq } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import type { Constructor } from 'utils'

import type { UpdateData } from '../utils'
import { makeUpdate } from '../utils'
import type { Artist } from './artists'
import type { DatabaseBase } from './base'
import { releaseArtists } from './release-artists'

export type Release = InferModel<typeof releases>
export type InsertRelease = InferModel<typeof releases, 'insert'>
export const releases = sqliteTable('releases', {
  id: integer('id').primaryKey(),
  title: text('title'),
})

export type ReleasesMixin = {
  releases: {
    insert: (release: InsertRelease) => Release
    update: (id: Release['id'], data: UpdateData<InsertRelease>) => Release
    getAll: () => Release[]
    get: (id: Release['id']) => Release
    getByArtist: (artistId: Artist['id']) => Release[]
    delete: (id: Release['id']) => void
  }
}

export const ReleasesMixin = <TBase extends Constructor<DatabaseBase>>(
  Base: TBase
): Constructor<ReleasesMixin> & TBase =>
  class extends Base implements ReleasesMixin {
    releases: ReleasesMixin['releases'] = {
      insert: (release) => {
        return this.db.insert(releases).values(release).returning().get()
      },

      update: (id, data) => {
        return this.db
          .update(releases)
          .set(makeUpdate(data))
          .where(eq(releases.id, id))
          .returning()
          .get()
      },

      getAll: () => {
        return this.db.select().from(releases).all()
      },

      get: (id) => {
        return this.db.select().from(releases).where(eq(releases.id, id)).get()
      },

      getByArtist: (artistId) => {
        return this.db
          .select()
          .from(releases)
          .innerJoin(releaseArtists, eq(releases.id, releaseArtists.releaseId))
          .where(eq(releaseArtists.artistId, artistId))
          .orderBy(releases.title)
          .all()
          .map((row) => row.releases)
      },

      delete: (id) => {
        return this.db.delete(releases).where(eq(releases.id, id)).run()
      },
    }
  }
