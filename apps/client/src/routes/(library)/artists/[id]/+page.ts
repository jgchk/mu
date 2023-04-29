import {
  prefetchArtistQuery,
  prefetchArtistReleasesQuery,
  prefetchArtistTracksQuery,
} from '$lib/services/artists'
import { getTracksSort } from '$lib/tracks-sort'
import { paramNumber } from '$lib/utils/params'

import type { PageLoad } from './$types'

export const load: PageLoad = async ({ parent, params, url }) => {
  const id = paramNumber(params.id, 'Release ID must be a number')

  const favoritesOnly = url.searchParams.get('favorites') !== null
  const sort = getTracksSort(url)

  const tracksQuery = {
    id,
    ...(favoritesOnly ? { favorite: true } : {}),
    ...(sort !== undefined ? { sort } : {}),
  }

  const { trpc } = await parent()
  await Promise.all([
    prefetchArtistQuery(trpc, id),
    prefetchArtistReleasesQuery(trpc, id),
    prefetchArtistTracksQuery(trpc, tracksQuery),
  ])

  return { id, tracksQuery }
}
