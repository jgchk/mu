import type { InferModel } from 'drizzle-orm'
import { eq, placeholder, sql } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import type { Constructor } from 'utils'

import type { UpdateData } from '../utils'
import { makeUpdate } from '../utils'
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
    insert: (artist: InsertArtist) => Artist
    getAll: () => Artist[]
    get: (id: Artist['id']) => Artist
    getByName: (name: Artist['name']) => Artist[]
    getByNameCaseInsensitive: (name: Artist['name']) => Artist[]
    getBySimilarName: (name: string) => Artist[]
    getByReleaseId: (releaseId: ReleaseArtist['releaseId']) => Artist[]
    getByTrackId: (trackId: TrackArtist['trackId']) => Artist[]
    update: (id: Artist['id'], data: UpdateData<Artist>) => Artist
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

export const ArtistsMixin = <TBase extends Constructor<DatabaseBase>>(
  Base: TBase
): Constructor<ArtistsMixin> & TBase =>
  class extends Base implements ArtistsMixin {
    artists: ArtistsMixin['artists'] = {
      preparedQueries: prepareQueries(this.db),

      insert: (artist) => {
        return this.db.insert(artists).values(artist).returning().get()
      },

      getAll: () => {
        return this.db.select().from(artists).all()
      },

      get: (id) => {
        return this.db.select().from(artists).where(eq(artists.id, id)).get()
      },

      getByName: (name) => {
        return this.db.select().from(artists).where(eq(artists.name, name)).all()
      },

      getByNameCaseInsensitive: (name) => {
        return this.artists.preparedQueries.getArtistsByNameCaseInsensitive.all({ name })
      },

      getBySimilarName: (name) => {
        return this.artists.preparedQueries.getArtistsBySimilarName.all({
          name: `%${name.toLowerCase()}%`,
        })
      },

      getByReleaseId: (releaseId) => {
        return this.db
          .select()
          .from(releaseArtists)
          .where(eq(releaseArtists.releaseId, releaseId))
          .innerJoin(artists, eq(releaseArtists.artistId, artists.id))
          .orderBy(releaseArtists.order)
          .all()
          .map((result) => ({ ...result.artists, order: result.release_artists.order }))
      },

      getByTrackId: (trackId) => {
        return this.db
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
        return this.db
          .update(artists)
          .set(makeUpdate(data))
          .where(eq(artists.id, id))
          .returning()
          .get()
      },
    }
  }
