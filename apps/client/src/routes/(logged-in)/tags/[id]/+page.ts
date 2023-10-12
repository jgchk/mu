import { getTracksSort } from '$lib/tracks-sort'
import { paramNumber } from '$lib/utils/params'

import type { PageLoad } from './$types'

export const load: PageLoad = ({ params, url }) => {
  const id = paramNumber(params.id, 'Tag ID must be a number')

  const favoritesOnly = url.searchParams.get('favorites') !== null
  const sort = getTracksSort(url)

  const tracksQuery = {
    tagId: id,
    filter: {
      ...(favoritesOnly ? { favorite: true } : {}),
      ...(sort !== undefined ? { sort } : {}),
    },
  }

  return { id, tracksQuery }
}
