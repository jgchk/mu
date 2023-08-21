import { fetchReleaseTracksQuery } from '$lib/services/releases'
import { prefetchReleaseTagsQuery, prefetchTrackTagsQuery } from '$lib/services/tags'
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
    trpc.releases.get.prefetchQuery({ id }),
    fetchReleaseTracksQuery(trpc, tracksQuery).then((releaseTracks) =>
      Promise.all(releaseTracks.map((rt) => prefetchTrackTagsQuery(trpc, rt.id)))
    ),
    prefetchReleaseTagsQuery(trpc, id),
  ])

  return { id, tracksQuery }
}
