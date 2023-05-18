import {
  fetchArtistTracksQuery,
  prefetchArtistQuery,
  prefetchArtistReleasesQuery,
} from '$lib/services/artists'
import { prefetchTrackTagsQuery } from '$lib/services/tags'
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
    fetchArtistTracksQuery(trpc, tracksQuery).then((tracks) =>
      Promise.all(tracks.map((track) => prefetchTrackTagsQuery(trpc, track.id)))
    ),
  ])

  return { id, tracksQuery }
}