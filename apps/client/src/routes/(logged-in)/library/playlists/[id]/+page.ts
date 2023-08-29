import { prefetchPlaylistQuery } from '$lib/services/playlists'
import { getTracksSort } from '$lib/tracks-sort'
import { paramNumber } from '$lib/utils/params'

import type { PageLoad } from './$types'

export const load: PageLoad = async ({ parent, params, url }) => {
  const id = paramNumber(params.id, 'Playlist ID must be a number')

  const favoritesOnly = url.searchParams.get('favorites') !== null
  const sort = getTracksSort(url)

  const tracksQuery = {
    ...(favoritesOnly ? { favorite: true } : {}),
    ...(sort !== undefined ? { sort } : {}),
  }

  const { trpc } = await parent()
  await Promise.all([
    prefetchPlaylistQuery(trpc, id),
    trpc.tracks.getByPlaylistId.prefetchQuery({ playlistId: id, filter: tracksQuery }),
  ])

  return { id, tracksQuery }
}
