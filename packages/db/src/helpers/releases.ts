import { eq, placeholder, sql } from 'drizzle-orm'
import { equalsWithoutOrder, withProps } from 'utils'

import type { Artist } from '../schema/artists'
import { releaseArtists } from '../schema/release-artists'
import type { InsertRelease, Release } from '../schema/releases'
import { releases } from '../schema/releases'
import type { UpdateData } from '../utils'
import { hasUpdate, makeUpdate } from '../utils'
import type { DatabaseBase } from './base'

export type ReleasesMixin = {
  releases: {
    preparedQueries: PreparedQueries
    insert: (release: InsertRelease) => Release
    update: (id: Release['id'], data: UpdateData<InsertRelease>) => Release | undefined
    getAll: () => Release[]
    get: (id: Release['id']) => Release | undefined
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

export const ReleasesMixin = <T extends DatabaseBase>(base: T): T & ReleasesMixin => {
  const releasesMixin: ReleasesMixin['releases'] = {
    preparedQueries: prepareQueries(base.db),

    insert: (release) => {
      return base.db.insert(releases).values(release).returning().get()
    },

    update: (id, data) => {
      const update = makeUpdate(data)
      if (!hasUpdate(update)) return releasesMixin.get(id)
      return base.db.update(releases).set(update).where(eq(releases.id, id)).returning().get()
    },

    getAll: () => {
      return base.db.select().from(releases).orderBy(releases.title).all()
    },

    get: (id) => {
      return base.db.select().from(releases).where(eq(releases.id, id)).get()
    },

    getByArtist: (artistId) => {
      return base.db
        .select()
        .from(releases)
        .innerJoin(releaseArtists, eq(releases.id, releaseArtists.releaseId))
        .where(eq(releaseArtists.artistId, artistId))
        .orderBy(releases.title)
        .all()
        .map((row) => row.releases)
    },

    findByTitleCaseInsensitiveAndArtists: (title, artists) => {
      const titleMatches = releasesMixin.preparedQueries.getReleasesByTitleCaseInsensitive.all({
        title,
      })

      const match = titleMatches.find((release) => {
        const artistIds = base.db
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
      return base.db.delete(releases).where(eq(releases.id, id)).run()
    },
  }

  return withProps(base, { releases: releasesMixin })
}
