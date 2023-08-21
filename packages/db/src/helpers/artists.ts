import { eq, placeholder, sql } from 'drizzle-orm'
import { withProps } from 'utils'

import type { ReleaseArtist, TrackArtist } from '../schema'
import { releaseArtists, trackArtists } from '../schema'
import type { Artist, InsertArtist } from '../schema/artists'
import { artists } from '../schema/artists'
import type { UpdateData } from '../utils'
import { hasUpdate, makeUpdate } from '../utils'
import type { DatabaseBase } from './base'

export type ArtistsMixin = {
  artists: {
    preparedQueries: PreparedQueries
    insert: (artist: InsertArtist) => Artist
    getAll: () => Artist[]
    get: (id: Artist['id']) => Artist | undefined
    getByName: (name: Artist['name']) => Artist[]
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

    insert: (artist) => {
      return base.db.insert(artists).values(artist).returning().get()
    },

    getAll: () => {
      return base.db.select().from(artists).orderBy(artists.name).all()
    },

    get: (id) => {
      return base.db.select().from(artists).where(eq(artists.id, id)).get()
    },

    getByName: (name) => {
      return base.db.select().from(artists).where(eq(artists.name, name)).all()
    },

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
      if (!hasUpdate(update)) return artistsMixin.get(id)
      return base.db.update(artists).set(update).where(eq(artists.id, id)).returning().get()
    },
  }

  return withProps(base, { artists: artistsMixin })
}
