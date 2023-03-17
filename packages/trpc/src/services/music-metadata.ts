import {
  Artist,
  getArtistsByReleaseId,
  getReleaseById,
  getTrackWithArtistsById,
  Track,
  TrackArtist
} from 'db';
import type { Metadata } from 'music-metadata';

import { deepEquals, ifNotNull } from '../utils/types';

export const isMetadataChanged = (trackId: Track['id'], metadata: Metadata) => {
  const trackMetadata = getMetadataFromTrack(trackId);
  return !deepEquals(trackMetadata, metadata);
};

export const getMetadataFromTrack = (trackId: Track['id']): Metadata => {
  const track = getTrackWithArtistsById(trackId);
  return {
    title: track.title ?? undefined,
    artists: track.artists.sort(compareArtists).map((artist) => artist.name),
    album: ifNotNull(track.releaseId, (releaseId) => getReleaseById(releaseId).title) ?? undefined,
    albumArtists:
      ifNotNull(track.releaseId, (releaseId) =>
        getArtistsByReleaseId(releaseId)
          .sort(compareArtists)
          .map((artist) => artist.name)
      ) ?? [],
    trackNumber: track.trackNumber ?? undefined
  };
};

type ComparableArtist = { order: TrackArtist['order']; name: Artist['name'] };
export const compareArtists = (a: ComparableArtist, b: ComparableArtist) =>
  a.order - b.order || a.name.localeCompare(b.name);
