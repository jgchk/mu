import type { InferModel } from 'drizzle-orm'
import { eq, placeholder, sql } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import type { Constructor } from 'utils'
import { equalsWithoutOrder } from 'utils'

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
    preparedQueries: PreparedQueries
    insert: (release: InsertRelease) => Release
    update: (id: Release['id'], data: UpdateData<InsertRelease>) => Release
    getAll: () => Release[]
    get: (id: Release['id']) => Release
    getByArtist: (artistId: Artist['id']) => Release[]
    findByTitleCaseInsensitiveAndArtists: (
      title: string,
      artists: Artist['id'][]
    ) => Release | undefined
    delete: (id: Release['id']) => void
  }
}

type PreparedQueries = ReturnType<typeof prepareQueries>
const prepareQueries = (db: DatabaseBase['db']) => ({
  getReleasesByTitleCaseInsensitive: db
    .select()
    .from(releases)
    .where(sql`lower(${releases.title}) = lower(${placeholder('title')})`)
    .prepare(),
})

export const ReleasesMixin = <TBase extends Constructor<DatabaseBase>>(
  Base: TBase
): Constructor<ReleasesMixin> & TBase =>
  class extends Base implements ReleasesMixin {
    releases: ReleasesMixin['releases'] = {
      preparedQueries: prepareQueries(this.db),

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

      findByTitleCaseInsensitiveAndArtists: (title, artists) => {
        const titleMatches = this.releases.preparedQueries.getReleasesByTitleCaseInsensitive.all({
          title,
        })

        const match = titleMatches.find((release) => {
          const artistIds = this.db
            .select()
            .from(releaseArtists)
            .where(eq(releaseArtists.releaseId, release.id))
            .all()
            .map((a) => a.artistId)
          return equalsWithoutOrder(artistIds, artists)
        })

        return match
      },

      delete: (id) => {
        return this.db.delete(releases).where(eq(releases.id, id)).run()
      },
    }
  }
