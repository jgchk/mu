import { z } from 'zod'

import { search } from '../services/soundcloud'
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
    .query(({ input: { query } }) => search(query)),
})

export type AppRouter = typeof appRouter
