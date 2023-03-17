import {
  getAllReleases,
  getReleaseWithArtistsById,
  getTracksByReleaseId,
  insertArtist,
  updateReleaseWithArtists
} from 'db';
import { writeTrackMetadata } from 'music-metadata';
import { z } from 'zod';

import { getMetadataFromTrack } from '../services/music-metadata';
import { publicProcedure, router } from '../trpc';
import { ifDefined } from '../utils/types';

export const releasesRouter = router({
  getAll: publicProcedure.query(() =>
    getAllReleases().map((release) => ({
      ...release,
      hasCoverArt: getTracksByReleaseId(release.id).some((track) => track.hasCoverArt)
    }))
  ),
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input: { id } }) => getReleaseWithArtistsById(id)),
  updateMetadata: publicProcedure
    .input(
      z.object({
        id: z.number(),
        data: z.object({
          title: z.string(),
          artists: z.union([z.number(), z.string()]).array().optional()
        })
      })
    )
    .mutation(async ({ input: { id, data } }) => {
      const artists = ifDefined(data.artists, (artists) =>
        artists.map((artist) => {
          if (typeof artist === 'number') {
            return artist;
          } else {
            return insertArtist({ name: artist }).id;
          }
        })
      );

      const release = updateReleaseWithArtists(id, { ...data, artists });
      const tracks = getTracksByReleaseId(release.id);

      await Promise.all(
        tracks.map((track) => writeTrackMetadata(track.path, getMetadataFromTrack(track.id)))
      );

      return release;
    })
});
