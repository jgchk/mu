import { ifNotNull } from 'utils'

import { prefetchAllTracksWithArtistsAndReleaseQuery } from '$lib/services/tracks'
import { paramNumber } from '$lib/utils/params'

import type { PageLoad } from './$types'
import { makeTracksQueryInput } from './common'

export const load: PageLoad = async ({ parent, url }) => {
  const favoritesParam = url.searchParams.get('favorites')
  const favoritesOnly = favoritesParam !== null

  const tag =
    ifNotNull(url.searchParams.get('tag'), (tag) => paramNumber(tag, 'Tag ID must be a number')) ??
    undefined

  const data = { favoritesOnly, tag }

  const { trpc } = await parent()
  await prefetchAllTracksWithArtistsAndReleaseQuery(trpc, makeTracksQueryInput(data))

  return data
}
