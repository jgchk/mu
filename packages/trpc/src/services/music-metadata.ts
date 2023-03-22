import type { Artist, Database, Track, TrackArtist } from 'db'
import type { Metadata } from 'music-metadata'

import { deepEquals, ifNotNull } from '../utils/types'

export const isMetadataChanged = (db: Database, trackId: Track['id'], metadata: Metadata) => {
  const trackMetadata = getMetadataFromTrack(db, trackId)
  return !deepEquals(trackMetadata, metadata)
}

export const getMetadataFromTrack = (db: Database, trackId: Track['id']): Metadata => {
  const track = db.tracks.getWithArtists(trackId)
  return {
    title: track.title ?? null,
    artists: track.artists.sort(compareArtists).map((artist) => artist.name),
    album: ifNotNull(track.releaseId, (releaseId) => db.releases.get(releaseId).title) ?? null,
    albumArtists:
      ifNotNull(track.releaseId, (releaseId) =>
        db.artists
          .getByReleaseId(releaseId)
          .sort(compareArtists)
          .map((artist) => artist.name)
      ) ?? [],
    trackNumber: track.trackNumber ?? null,
  }
}

type ComparableArtist = { order: TrackArtist['order']; name: Artist['name'] }
export const compareArtists = (a: ComparableArtist, b: ComparableArtist) =>
  a.order - b.order || a.name.localeCompare(b.name)
