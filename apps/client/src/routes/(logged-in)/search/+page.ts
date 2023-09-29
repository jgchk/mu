import { NUM_TRACKS } from '../library/all/common'
import type { PageLoad } from './$types'

export const load: PageLoad = async ({ parent }) => {
  const { trpc, searchQuery } = await parent()

  if (searchQuery?.length) {
    await Promise.all([
      trpc.tracks.getAll.prefetchQuery({ title: searchQuery, limit: NUM_TRACKS }),
      trpc.releases.getAll.prefetchQuery({ title: searchQuery }),
      trpc.artists.getAll.prefetchQuery({ name: searchQuery }),
      trpc.playlists.getAll.prefetchQuery({ name: searchQuery }),
      trpc.tags.getAll.prefetchQuery({ name: searchQuery }),
    ])
  }

  return { searchQuery }
}
