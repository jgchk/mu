import type { BoolLang } from 'bool-lang'
import { eq, inArray, placeholder, sql } from 'drizzle-orm'
import { withProps } from 'utils'

import type { Artist } from '../schema/artists'
import { trackArtists } from '../schema/track-artists'
import type { InsertTrack, Track } from '../schema/tracks'
import { tracks } from '../schema/tracks'
import type { UpdateData } from '../utils'
import { hasUpdate, makeUpdate } from '../utils'
import type { DatabaseBase } from './base'

export type TracksFilter = {
  favorite?: boolean
  tags?: BoolLang
  sort?: TracksSort
  skip?: number
  limit?: number
}
export type TracksSort = {
  column: TracksSortColumn
  direction: TracksSortDirection
}
export type TracksSortColumn = 'title' | 'artists' | 'release' | 'duration' | 'order'
export type TracksSortDirection = 'asc' | 'desc'

export type TracksMixin = {
  tracks: {
    insert: (track: InsertTrack) => Track
    update: (id: Track['id'], data: UpdateData<InsertTrack>) => Track | undefined
    getByArtistAndTitleCaseInsensitive: (
      artistId: Artist['id'],
      title: NonNullable<Track['title']>
    ) => Track[]
    getByPath: (path: Track['path']) => Track | undefined
    get: (id: Track['id']) => Track | undefined
    getMany: (ids: Track['id'][]) => Track[]
    delete: (id: Track['id']) => void

    preparedQueries: PreparedQueries
  }
}

type PreparedQueries = ReturnType<typeof prepareQueries>
const prepareQueries = (db: DatabaseBase['db']) => ({
  getByArtistAndTitleCaseInsensitive: db
    .select()
    .from(tracks)
    .where(eq(trackArtists.artistId, placeholder('artistId')))
    .where(sql`lower(${tracks.title}) = ${placeholder('title')}`)
    .prepare(),
})

export const TracksMixin = <T extends DatabaseBase>(base: T): T & TracksMixin => {
  const tracksMixin: TracksMixin['tracks'] = {
    insert: (track) => {
      return base.db.insert(tracks).values(track).returning().get()
    },

    update: (id, data) => {
      const update = makeUpdate(data)
      if (!hasUpdate(update)) return tracksMixin.get(id)
      return base.db.update(tracks).set(update).where(eq(tracks.id, id)).returning().get()
    },

    getByArtistAndTitleCaseInsensitive: (artistId, title) => {
      return tracksMixin.preparedQueries.getByArtistAndTitleCaseInsensitive.all({
        artistId,
        title: title.toLowerCase(),
      })
    },

    getByPath: (path) => {
      return base.db.select().from(tracks).where(eq(tracks.path, path)).limit(1).all().at(0)
    },

    get: (id) => {
      return base.db.select().from(tracks).where(eq(tracks.id, id)).get()
    },

    getMany: (ids) => {
      if (ids.length === 0) return []
      return base.db.select().from(tracks).where(inArray(tracks.id, ids)).all()
    },

    delete: (id) => {
      return base.db.delete(tracks).where(eq(tracks.id, id)).run()
    },

    preparedQueries: prepareQueries(base.db),
  }

  return withProps(base, { tracks: tracksMixin })
}
