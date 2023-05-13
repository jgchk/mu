import { router } from '../trpc'
import { accountsRouter } from './accounts'
import { artistsRouter } from './artists'
import { downloadsRouter } from './downloads'
import { friendsRouter } from './friends'
import { importRouter } from './import'
import { playbackRouter } from './playback'
import { playlistsRouter } from './playlists'
import { releasesRouter } from './releases'
import { searchRouter } from './search'
import { systemRouter } from './system'
import { tagsRouter } from './tags'
import { tracksRouter } from './tracks'

export const appRouter = router({
  tracks: tracksRouter,
  releases: releasesRouter,
  artists: artistsRouter,
  playlists: playlistsRouter,
  downloads: downloadsRouter,
  import: importRouter,
  search: searchRouter,
  friends: friendsRouter,
  playback: playbackRouter,
  system: systemRouter,
  tags: tagsRouter,
  accounts: accountsRouter,
})

export type AppRouter = typeof appRouter
