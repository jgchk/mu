import { observable } from '@trpc/server/observable';
import type { Messages } from 'soulseek-ts';
import { z } from 'zod';

import { search, searchSubscription } from '../services/soulseek';
import { getSoundcloudImageUrl, searchAlbums, searchTracks } from '../services/soundcloud';
import { publicProcedure, router } from '../trpc';
import { ifNotNull } from '../utils/types';

export const searchRouter = router({
  soundcloud: publicProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ input: { query } }) => {
      const [tracks, albums] = await Promise.all([searchTracks(query), searchAlbums(query)]);
      return {
        tracks: tracks.map((track) => ({
          ...track,
          artwork: ifNotNull(track.artwork_url, (artworkUrl) => ({
            200: getSoundcloudImageUrl(artworkUrl, 200)
          }))
        })),
        albums: albums.map((album) => ({
          ...album,
          artwork: ifNotNull(album.artwork_url, (artworkUrl) => ({
            200: getSoundcloudImageUrl(artworkUrl, 200)
          }))
        }))
      };
    }),
  soulseek: publicProcedure
    .input(z.object({ query: z.string() }))
    .query(({ input: { query } }) => search(query)),
  soulseekSubscription: publicProcedure
    .input(z.object({ query: z.string() }))
    .subscription(({ input: { query } }) =>
      observable<Messages.From.Peer.FileSearchResponse>((emit) => {
        void searchSubscription(query, (result) => emit.next(result));
      })
    )
});
