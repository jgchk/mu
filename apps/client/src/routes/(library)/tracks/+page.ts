import { decode } from 'bool-lang'
import { ifNotNull } from 'utils'

import { prefetchTagsQuery } from '$lib/services/tags'
import { prefetchAllTracksWithArtistsAndReleaseQuery } from '$lib/services/tracks'
import { getTracksSort } from '$lib/tracks-sort'
import type { RouterInput } from '$lib/trpc'

import type { PageLoad } from './$types'

export const load: PageLoad = async ({ parent, url }) => {
  const favoritesOnly = url.searchParams.get('favorites') !== null

  const tags =
    ifNotNull(url.searchParams.get('tags'), (tags) => ({
      text: tags,
      parsed: decode(tags),
    })) ?? undefined

  const sort = getTracksSort(url)

  const query: RouterInput['tracks']['getAllWithArtistsAndRelease'] = {
    limit: 100,
    ...(favoritesOnly ? { favorite: true } : {}),
    ...(tags !== undefined ? { tags: tags.text } : {}),
    ...(sort !== undefined ? { sort } : {}),
  }

  const { trpc } = await parent()
  await Promise.all([
    prefetchAllTracksWithArtistsAndReleaseQuery(trpc, query),
    prefetchTagsQuery(trpc),
  ])

  return { favoritesOnly, tags, query }
}
