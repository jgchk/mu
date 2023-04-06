import { publicProcedure, router } from '../trpc'
import { artistsRouter } from './artists'
import { downloadsRouter } from './downloads'
import { friendsRouter } from './friends'
import { importRouter } from './import'
import { releasesRouter } from './releases'
import { searchRouter } from './search'
import { tracksRouter } from './tracks'

export const appRouter = router({
  ping: publicProcedure.query(() => 'pong'),
  tracks: tracksRouter,
  releases: releasesRouter,
  artists: artistsRouter,
  downloads: downloadsRouter,
  import: importRouter,
  search: searchRouter,
  friends: friendsRouter,
})

export type AppRouter = typeof appRouter
