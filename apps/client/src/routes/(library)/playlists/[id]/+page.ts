import { prefetchPlaylistQuery, prefetchPlaylistTracksQuery } from '$lib/services/playlists'
import { prefetchTagsQuery } from '$lib/services/tags'
import { getTracksSort } from '$lib/tracks-sort'
import { paramNumber } from '$lib/utils/params'

import type { PageLoad } from './$types'

export const load: PageLoad = async ({ parent, params, url }) => {
  const id = paramNumber(params.id, 'Playlist ID must be a number')

  const favoritesOnly = url.searchParams.get('favorites') !== null
  const sort = getTracksSort(url)

  const tracksQuery = {
    id,
    ...(favoritesOnly ? { favorite: true } : {}),
    ...(sort !== undefined ? { sort } : {}),
  }

  const { trpc } = await parent()
  await Promise.all([
    prefetchPlaylistQuery(trpc, id),
    prefetchPlaylistTracksQuery(trpc, tracksQuery),
    prefetchTagsQuery(trpc),
  ])

  return { id, tracksQuery }
}
