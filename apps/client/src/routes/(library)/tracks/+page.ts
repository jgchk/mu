import { decode } from 'bool-lang'
import { ifNotNull } from 'utils'

import { prefetchTagsQuery } from '$lib/services/tags'
import { prefetchAllTracksWithArtistsAndReleaseQuery } from '$lib/services/tracks'

import type { PageLoad } from './$types'

export const load: PageLoad = async ({ parent, url }) => {
  const favoritesOnly = url.searchParams.get('favorites') !== null

  const tags =
    ifNotNull(url.searchParams.get('tags'), (tags) => ({
      text: tags,
      parsed: decode(tags),
    })) ?? undefined

  const query = {
    limit: 100,
    ...(favoritesOnly ? { favorite: true } : {}),
    ...(tags !== undefined ? { tags: tags.text } : {}),
  }

  const { trpc } = await parent()
  await Promise.all([
    prefetchAllTracksWithArtistsAndReleaseQuery(trpc, query),
    prefetchTagsQuery(trpc),
  ])

  return { favoritesOnly, tags, query }
}
