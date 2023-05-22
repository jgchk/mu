import type { InferModel } from 'drizzle-orm'
import { eq } from 'drizzle-orm'
import { integer, primaryKey, sqliteTable } from 'drizzle-orm/sqlite-core'
import { withProps } from 'utils'

import { artists } from './artists'
import type { DatabaseBase } from './base'
import { releases } from './releases'

export type ReleaseArtist = InferModel<typeof releaseArtists>
export type InsertReleaseArtist = InferModel<typeof releaseArtists, 'insert'>
export const releaseArtists = sqliteTable(
  'release_artists',
  {
    releaseId: integer('release_id')
      .references(() => releases.id)
      .notNull(),
    artistId: integer('artist_id')
      .references(() => artists.id)
      .notNull(),
    order: integer('order').notNull(),
  },
  (releaseArtists) => ({
    releaseArtistsPrimaryKey: primaryKey(releaseArtists.releaseId, releaseArtists.artistId),
  })
)

export type ReleaseArtistsMixin = {
  releaseArtists: {
    insertMany: (releaseArtists: InsertReleaseArtist[]) => ReleaseArtist[]
    insertManyByReleaseId: (
      releaseId: ReleaseArtist['releaseId'],
      artistIds: ReleaseArtist['artistId'][]
    ) => ReleaseArtist[]
    updateByReleaseId: (
      releaseId: ReleaseArtist['releaseId'],
      artistIds: ReleaseArtist['artistId'][]
    ) => ReleaseArtist[]
    getByReleaseId: (releaseId: ReleaseArtist['releaseId']) => ReleaseArtist[]
    deleteByReleaseId: (releaseId: ReleaseArtist['releaseId']) => void
  }
}

export const ReleaseArtistsMixin = <T extends DatabaseBase>(base: T): T & ReleaseArtistsMixin => {
  const releaseArtistsMixin: ReleaseArtistsMixin['releaseArtists'] = {
    insertMany: (releaseArtists_) => {
      if (releaseArtists_.length === 0) return []
      return base.db.insert(releaseArtists).values(releaseArtists_).returning().all()
    },

    insertManyByReleaseId: (releaseId, artistIds) => {
      return releaseArtistsMixin.insertMany(
        artistIds.map((artistId, order) => ({
          releaseId,
          artistId,
          order,
        }))
      )
    },

    updateByReleaseId: (releaseId, artistIds) => {
      releaseArtistsMixin.deleteByReleaseId(releaseId)
      return releaseArtistsMixin.insertManyByReleaseId(releaseId, artistIds)
    },

    getByReleaseId: (releaseId) => {
      return base.db
        .select()
        .from(releaseArtists)
        .where(eq(releaseArtists.releaseId, releaseId))
        .all()
    },

    deleteByReleaseId: (releaseId) => {
      return base.db.delete(releaseArtists).where(eq(releaseArtists.releaseId, releaseId)).run()
    },
  }

  return withProps(base, { releaseArtists: releaseArtistsMixin })
}
