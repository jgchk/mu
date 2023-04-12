import { prefetchAllTracksWithArtistsAndReleaseQuery } from '$lib/services/tracks'

import type { PageLoad } from './$types'
import { makeTracksQueryInput } from './common'

export const load: PageLoad = async ({ parent, url }) => {
  const favoritesParam = url.searchParams.get('favorites')
  const favoritesOnly = favoritesParam !== null

  const { trpc } = await parent()
  await prefetchAllTracksWithArtistsAndReleaseQuery(trpc, makeTracksQueryInput(favoritesOnly))

  return { favoritesOnly }
}
