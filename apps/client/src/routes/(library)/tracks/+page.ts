import { decode } from 'bool-lang'
import { ifNotNull } from 'utils'

import { prefetchTagsQuery } from '$lib/services/tags'
import { prefetchAllTracksWithArtistsAndReleaseQuery } from '$lib/services/tracks'

import type { PageLoad } from './$types'
import { makeTracksQueryInput } from './common'

export const load: PageLoad = async ({ parent, url }) => {
  const favoritesParam = url.searchParams.get('favorites')
  const favoritesOnly = favoritesParam !== null

  const tags = ifNotNull(url.searchParams.get('tags'), decode) ?? undefined

  const data = { favoritesOnly, tags }

  const { trpc } = await parent()
  await Promise.all([
    prefetchAllTracksWithArtistsAndReleaseQuery(trpc, makeTracksQueryInput(data)),
    prefetchTagsQuery(trpc),
  ])

  return data
}
