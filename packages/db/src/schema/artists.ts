import type { InferModel } from 'drizzle-orm'
import { eq, placeholder, sql } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { withProps } from 'utils'

import type { UpdateData } from '../utils'
import { hasUpdate, makeUpdate } from '../utils'
import type { DatabaseBase } from './base'
import { images } from './images'
import type { ReleaseArtist } from './release-artists'
import { releaseArtists } from './release-artists'
import type { TrackArtist } from './track-artists'
import { trackArtists } from './track-artists'

export type Artist = InferModel<typeof artists>
export type InsertArtist = InferModel<typeof artists, 'insert'>
export const artists = sqliteTable('artists', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  imageId: integer('image_id').references(() => images.id),
})

export type ArtistsMixin = {
  artists: {
    preparedQueries: PreparedQueries
    getByNameCaseInsensitive: (name: Artist['name']) => Artist[]
    getBySimilarName: (name: string) => Artist[]
    getByReleaseId: (releaseId: ReleaseArtist['releaseId']) => Artist[]
    getByTrackId: (trackId: TrackArtist['trackId']) => Artist[]
    update: (id: Artist['id'], data: UpdateData<Artist>) => Artist | undefined
  }
}

type PreparedQueries = ReturnType<typeof prepareQueries>
const prepareQueries = (db: DatabaseBase['db']) => ({
  getArtistsBySimilarName: db
    .select()
    .from(artists)
    .where(sql`lower(${artists.name}) like ${placeholder('name')}`)
    .prepare(),
  getArtistsByNameCaseInsensitive: db
    .select()
    .from(artists)
    .where(sql`lower(${artists.name}) = lower(${placeholder('name')})`)
    .prepare(),
})

export const ArtistsMixin = <T extends DatabaseBase>(base: T): T & ArtistsMixin => {
  const artistsMixin: ArtistsMixin['artists'] = {
    preparedQueries: prepareQueries(base.db),

    getByNameCaseInsensitive: (name) => {
      return artistsMixin.preparedQueries.getArtistsByNameCaseInsensitive.all({ name })
    },

    getBySimilarName: (name) => {
      return artistsMixin.preparedQueries.getArtistsBySimilarName.all({
        name: `%${name.toLowerCase()}%`,
      })
    },

    getByReleaseId: (releaseId) => {
      return base.db
        .select()
        .from(releaseArtists)
        .where(eq(releaseArtists.releaseId, releaseId))
        .innerJoin(artists, eq(releaseArtists.artistId, artists.id))
        .orderBy(releaseArtists.order)
        .all()
        .map((result) => ({ ...result.artists, order: result.release_artists.order }))
    },

    getByTrackId: (trackId) => {
      return base.db
        .select()
        .from(trackArtists)
        .where(eq(trackArtists.trackId, trackId))
        .innerJoin(artists, eq(trackArtists.artistId, artists.id))
        .orderBy(trackArtists.order)
        .all()
        .map((row) => ({
          ...row.artists,
          order: row.track_artists.order,
        }))
    },

    update: (id, data) => {
      const update = makeUpdate(data)
      if (!hasUpdate(update)) return base.db.select().from(artists).where(eq(artists.id, id)).get()
      return base.db.update(artists).set(update).where(eq(artists.id, id)).returning().get()
    },
  }

  return withProps(base, { artists: artistsMixin })
}
