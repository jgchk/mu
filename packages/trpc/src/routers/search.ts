import { observable } from '@trpc/server/observable'
import type { Messages } from 'soulseek-ts'
import { Soundcloud } from 'soundcloud'
import { z } from 'zod'

import { publicProcedure, router } from '../trpc'
import { ifNotNull } from '../utils/types'

export const searchRouter = router({
  soundcloud: publicProcedure
    .input(z.object({ query: z.string() }))
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
  spotify: publicProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ input: { query }, ctx }) => {
      const results = await ctx.sp.search(query, ['track', 'album'])
      return {
        tracks: results.tracks.items,
        albums: results.albums.items,
      }
    }),
  soulseekSubscription: publicProcedure
    .input(z.object({ query: z.string() }))
    .subscription(({ input: { query }, ctx }) => {
      const slsk = ctx.slsk
      if (!slsk) {
        throw new Error('Soulseek is not running')
      }
      return observable<Messages.From.Peer.FileSearchResponse>((emit) => {
        void slsk.search(query, { onResult: (result) => emit.next(result) })
      })
    }),
})
