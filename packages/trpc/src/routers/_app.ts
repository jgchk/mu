import { router } from '../trpc'
import { artistsRouter } from './artists'
import { downloadsRouter } from './downloads'
import { friendsRouter } from './friends'
import { importRouter } from './import'
import { playbackRouter } from './playback'
import { releasesRouter } from './releases'
import { searchRouter } from './search'
import { tracksRouter } from './tracks'

export const appRouter = router({
  tracks: tracksRouter,
  releases: releasesRouter,
  artists: artistsRouter,
  downloads: downloadsRouter,
  import: importRouter,
  search: searchRouter,
  friends: friendsRouter,
  playback: playbackRouter,
})

export type AppRouter = typeof appRouter
