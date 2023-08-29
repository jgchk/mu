import { prefetchArtistQuery } from '$lib/services/artists'
import { getTracksSort } from '$lib/tracks-sort'
import { paramNumber } from '$lib/utils/params'

import type { PageLoad } from './$types'

export const load: PageLoad = async ({ parent, params, url }) => {
  const id = paramNumber(params.id, 'Release ID must be a number')

  const favoritesOnly = url.searchParams.get('favorites') !== null
  const sort = getTracksSort(url)

  const tracksQuery = {
    id,
    artistId: id,
    ...(favoritesOnly ? { favorite: true } : {}),
    ...(sort !== undefined ? { sort } : {}),
  }

  const { trpc } = await parent()
  await Promise.all([
    prefetchArtistQuery(trpc, id),
    trpc.releases.getByArtistId.prefetchQuery({ artistId: id }),
    trpc.tracks.getAll.prefetchInfiniteQuery(tracksQuery),
  ])

  return { id, tracksQuery }
}
