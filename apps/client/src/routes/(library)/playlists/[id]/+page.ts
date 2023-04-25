import { prefetchPlaylistQuery, prefetchPlaylistTracksQuery } from '$lib/services/playlists'
import { prefetchTagsQuery } from '$lib/services/tags'
import { paramNumber } from '$lib/utils/params'

import type { PageLoad } from './$types'

export const load: PageLoad = async ({ parent, params, url }) => {
  const id = paramNumber(params.id, 'Playlist ID must be a number')
  const favoritesOnly = url.searchParams.get('favorites') !== null

  const tracksQuery = {
    id,
    ...(favoritesOnly ? { favorite: true } : {}),
  }

  const { trpc } = await parent()
  await Promise.all([
    prefetchPlaylistQuery(trpc, id),
    prefetchPlaylistTracksQuery(trpc, tracksQuery),
    prefetchTagsQuery(trpc),
  ])

  return { id, tracksQuery }
}
