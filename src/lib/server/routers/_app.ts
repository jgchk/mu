import { z } from 'zod'

import { ifNotNull } from '$lib/utils/types'

import { getSoundcloudImageUrl, searchAlbums, searchTracks } from '../services/soundcloud'
import { publicProcedure, router } from '../trpc'
import { artistsRouter } from './artists'
import { downloadsRouter } from './downloads'
import { importRouter } from './import'
import { releasesRouter } from './releases'
import { tracksRouter } from './tracks'

export const appRouter = router({
  ping: publicProcedure.query(() => 'pong!'),
  tracks: tracksRouter,
  releases: releasesRouter,
  artists: artistsRouter,
  downloads: downloadsRouter,
  import: importRouter,
  search: publicProcedure
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
})

export type AppRouter = typeof appRouter
