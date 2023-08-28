import { decode } from 'bool-lang'
import { ifNotNull } from 'utils'

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

  const { trpc, searchQuery } = await parent()

  const query: RouterInput['tracks']['getAll'] = {
    title: searchQuery,
    limit: 100,
    ...(favoritesOnly ? { favorite: true } : {}),
    ...(tags !== undefined ? { tags: tags.text } : {}),
    ...(sort !== undefined ? { sort } : {}),
  }

  await trpc.tracks.getAll.prefetchInfiniteQuery(query)

  return { favoritesOnly, tags, query }
}
