import type { PageLoad } from './$types'
import { NUM_TRACKS } from './common'

export const load: PageLoad = async ({ parent }) => {
  const { trpc, searchQuery } = await parent()
  await Promise.all([
    trpc.tracks.getAll.prefetchQuery({ title: searchQuery, limit: NUM_TRACKS }),
    trpc.releases.getAll.prefetchQuery({ title: searchQuery }),
    trpc.artists.getAll.prefetchQuery({ name: searchQuery }),
    trpc.playlists.getAll.prefetchQuery({ name: searchQuery }),
  ])

  return { searchQuery }
}
