import {
  getAllTracks,
  getTracksByReleaseId,
  getTrackWithArtistsById,
  insertArtist,
  updateTrackWithArtists
} from 'db';
import { writeTrackMetadata } from 'music-metadata';
import { z } from 'zod';

import { getMetadataFromTrack } from '../services/music-metadata';
import { publicProcedure, router } from '../trpc';
import { ifDefined } from '../utils/types';

export const tracksRouter = router({
  getAll: publicProcedure.query(() => getAllTracks()),
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input: { id } }) => getTrackWithArtistsById(id)),
  getByReleaseId: publicProcedure
    .input(z.object({ releaseId: z.number() }))
    .query(({ input: { releaseId } }) => getTracksByReleaseId(releaseId)),
  updateMetadata: publicProcedure
    .input(
      z.object({
        id: z.number(),
        data: z.object({
          title: z.string().nullish(),
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
      const track = updateTrackWithArtists(id, { ...data, artists });
      await writeTrackMetadata(track.path, getMetadataFromTrack(track.id));
      return track;
    })
});
