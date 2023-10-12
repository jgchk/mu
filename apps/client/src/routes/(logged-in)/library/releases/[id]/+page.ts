import { getTracksSort } from '$lib/tracks-sort'
import { paramNumber } from '$lib/utils/params'

import type { PageLoad } from './$types'

export const load: PageLoad = ({ params, url }) => {
  const id = paramNumber(params.id, 'Release ID must be a number')

  const favoritesOnly = url.searchParams.get('favorites') !== null
  const sort = getTracksSort(url)

  const tracksQuery = {
    ...(favoritesOnly ? { favorite: true } : {}),
    ...(sort !== undefined ? { sort } : {}),
  }

  return { id, tracksQuery }
}
