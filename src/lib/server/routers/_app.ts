import { z } from 'zod'

import { searchAlbums, searchTracks } from '../services/soundcloud'
import { publicProcedure, router } from '../trpc'
import { artistsRouter } from './artists'
import { downloadsRouter } from './downloads'
import { importRouter } from './import'
import { tracksRouter } from './tracks'

export const appRouter = router({
  ping: publicProcedure.query(() => 'pong!'),
  tracks: tracksRouter,
  artists: artistsRouter,
  downloads: downloadsRouter,
  import: importRouter,
  search: publicProcedure
    .input(z.object({ query: z.string() }))
    .query(async ({ input: { query } }) => {
      const [tracks, albums] = await Promise.all([searchTracks(query), searchAlbums(query)])
      return {
        tracks,
        albums,
      }
    }),
})

export type AppRouter = typeof appRouter
