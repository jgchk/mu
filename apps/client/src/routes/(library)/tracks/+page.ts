import { ifNotNull } from 'utils'

import { prefetchAllTracksWithArtistsAndReleaseQuery } from '$lib/services/tracks'

import type { PageLoad } from './$types'
import { decodeTagsFilterUrl, makeTracksQueryInput } from './common'

export const load: PageLoad = async ({ parent, url }) => {
  const favoritesParam = url.searchParams.get('favorites')
  const favoritesOnly = favoritesParam !== null

  const tags = ifNotNull(url.searchParams.get('tags'), decodeTagsFilterUrl) ?? undefined

  const data = { favoritesOnly, tags }
  console.log('data', data)

  const { trpc } = await parent()
  await prefetchAllTracksWithArtistsAndReleaseQuery(trpc, makeTracksQueryInput(data))

  return data
}
