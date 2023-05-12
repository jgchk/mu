import { prefetchReleasesByTagQuery } from '$lib/services/releases'
import { prefetchTagQuery, prefetchTagsTreeQuery } from '$lib/services/tags'
import { prefetchTracksByTagQuery } from '$lib/services/tracks'
import { getTracksSort } from '$lib/tracks-sort'
import { paramNumber } from '$lib/utils/params'

import type { PageLoad } from './$types'

export const load: PageLoad = async ({ parent, params, url }) => {
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

  const { trpc } = await parent()
  await Promise.all([
    prefetchTagQuery(trpc, id),
    prefetchTagsTreeQuery(trpc),
    prefetchReleasesByTagQuery(trpc, id),
    prefetchTracksByTagQuery(trpc, tracksQuery),
  ])

  return { id, tracksQuery }
}
