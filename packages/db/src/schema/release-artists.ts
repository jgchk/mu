import type { InferModel } from 'drizzle-orm'
import { integer, primaryKey, sqliteTable } from 'drizzle-orm/sqlite-core'

import { artists } from './artists'
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
