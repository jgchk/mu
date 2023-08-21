import { eq } from 'drizzle-orm'
import { withProps } from 'utils'

import type { InsertTrackArtist, TrackArtist } from '../schema/track-artists'
import { trackArtists } from '../schema/track-artists'
import type { DatabaseBase } from './base'

export type TrackArtistsMixin = {
  trackArtists: {
    insertMany: (trackArtists: InsertTrackArtist[]) => TrackArtist[]
    insertManyByTrackId: (
      trackId: TrackArtist['trackId'],
      artistIds: TrackArtist['artistId'][]
    ) => TrackArtist[]
    updateByTrackId: (
      trackId: TrackArtist['trackId'],
      artistIds: TrackArtist['artistId'][]
    ) => TrackArtist[]
    getByTrackId: (trackId: TrackArtist['trackId']) => TrackArtist[]
    deleteByTrackId: (trackId: TrackArtist['trackId']) => void
  }
}

export const TrackArtistsMixin = <T extends DatabaseBase>(base: T): T & TrackArtistsMixin => {
  const trackArtistsMixin: TrackArtistsMixin['trackArtists'] = {
    insertMany: (trackArtists_) => {
      if (trackArtists_.length === 0) return []
      return base.db.insert(trackArtists).values(trackArtists_).returning().all()
    },

    insertManyByTrackId: (trackId, artistIds) => {
      return trackArtistsMixin.insertMany(
        artistIds.map((artistId, order) => ({
          trackId,
          artistId,
          order,
        }))
      )
    },

    updateByTrackId: (trackId, artistIds) => {
      trackArtistsMixin.deleteByTrackId(trackId)
      return trackArtistsMixin.insertManyByTrackId(trackId, artistIds)
    },

    getByTrackId: (trackId) => {
      return base.db.select().from(trackArtists).where(eq(trackArtists.trackId, trackId)).all()
    },

    deleteByTrackId: (trackId) => {
      return base.db.delete(trackArtists).where(eq(trackArtists.trackId, trackId)).run()
    },
  }

  return withProps(base, { trackArtists: trackArtistsMixin })
}
