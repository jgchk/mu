import { z } from 'zod'

import { ifNotNull } from '$lib/utils/types'

import { search } from '../services/soulseek'
import { getSoundcloudImageUrl, searchAlbums, searchTracks } from '../services/soundcloud'
import { publicProcedure, router } from '../trpc'

export const searchRouter = router({
  soundcloud: publicProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ input: { query } }) => {
      const [tracks, albums] = await Promise.all([searchTracks(query), searchAlbums(query)])
      return {
        tracks: tracks.map((track) => ({
          ...track,
          artwork: ifNotNull(track.artwork_url, (artworkUrl) => ({
            200: getSoundcloudImageUrl(artworkUrl, 200),
          })),
        })),
        albums: albums.map((album) => ({
          ...album,
          artwork: ifNotNull(album.artwork_url, (artworkUrl) => ({
            200: getSoundcloudImageUrl(artworkUrl, 200),
          })),
        })),
      }
    }),
  soulseek: publicProcedure
    .input(z.object({ query: z.string() }))
    .query(({ input: { query } }) => search(query)),
})
