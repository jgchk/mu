import { observable } from '@trpc/server/observable';
import type { Messages } from 'soulseek-ts';
import { Soundcloud } from 'soundcloud';
import { searchTracksAndAlbums } from 'spotify';
import { z } from 'zod';

import { search, searchSubscription } from '../services/soulseek';
import { publicProcedure, router } from '../trpc';
import { ifNotNull } from '../utils/types';

export const searchRouter = router({
  soundcloud: publicProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ input: { query }, ctx }) => {
      const [tracks, albums] = await Promise.all([
        ctx.sc.searchTracks(query),
        ctx.sc.searchAlbums(query)
      ]);
      return {
        tracks: tracks.map((track) => ({
          ...track,
          artwork: ifNotNull(track.artwork_url, (artworkUrl) => ({
            500: Soundcloud.getImageUrl(artworkUrl, 500)
          }))
        })),
        albums: albums.map((album) => ({
          ...album,
          artwork: ifNotNull(album.artwork_url, (artworkUrl) => ({
            500: Soundcloud.getImageUrl(artworkUrl, 500)
          }))
        }))
      };
    }),
  spotify: publicProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ input: { query } }) => {
      const results = await searchTracksAndAlbums(query);
      return {
        tracks: results.tracks.items,
        albums: results.albums.items
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
