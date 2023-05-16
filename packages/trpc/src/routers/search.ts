import { observable } from '@trpc/server/observable'
import type { Messages } from 'soulseek-ts'
import { Soundcloud } from 'soundcloud'
import { ifNotNull } from 'utils'
import { z } from 'zod'

import { protectedProcedure, router } from '../trpc'
import {
  isSoulseekAvailable,
  isSoundcloudAvailable,
  isSpotifyWebApiAvailable,
} from '../trpc/middleware'

export const searchRouter = router({
  soundcloud: protectedProcedure
    .input(z.object({ query: z.string() }))
    .use(isSoundcloudAvailable)
    .query(async ({ input: { query }, ctx }) => {
      const [tracks, albums] = await Promise.all([
        ctx.sc.searchTracks(query),
        ctx.sc.searchAlbums(query),
      ])
      return {
        tracks: tracks.map((track) => ({
          ...track,
          artwork: ifNotNull(track.artwork_url, (artworkUrl) => ({
            500: Soundcloud.getImageUrl(artworkUrl, 500),
          })),
        })),
        albums: albums.map((album) => ({
          ...album,
          artwork: ifNotNull(album.artwork_url, (artworkUrl) => ({
            500: Soundcloud.getImageUrl(artworkUrl, 500),
          })),
        })),
      }
    }),

  spotify: protectedProcedure
    .input(z.object({ query: z.string() }))
    .use(isSpotifyWebApiAvailable)
    .query(async ({ input: { query }, ctx }) => {
      const results = await ctx.sp.search(query, ['track', 'album'])
      return {
        tracks: results.tracks.items,
        albums: results.albums.items,
      }
    }),

  soulseekSubscription: protectedProcedure
    .input(z.object({ query: z.string() }))
    .use(isSoulseekAvailable)
    .subscription(({ input: { query }, ctx }) => {
      return observable<Messages.From.Peer.FileSearchResponse>((emit) => {
        void ctx.slsk.client.search(query, { onResult: (result) => emit.next(result) })
      })
    }),
})
