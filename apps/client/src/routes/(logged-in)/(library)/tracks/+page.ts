import { decode } from 'bool-lang'
import { ifNotNull } from 'utils'

import { prefetchTrackTagsQuery } from '$lib/services/tags'
import { fetchAllTracksWithArtistsAndReleaseQuery } from '$lib/services/tracks'
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

  const query: RouterInput['tracks']['getAll'] = {
    limit: 100,
    ...(favoritesOnly ? { favorite: true } : {}),
    ...(tags !== undefined ? { tags: tags.text } : {}),
    ...(sort !== undefined ? { sort } : {}),
  }

  const { trpc } = await parent()
  await fetchAllTracksWithArtistsAndReleaseQuery(trpc, query).then((data) =>
    Promise.all(
      data.pages.flatMap((page) =>
        page.items.map((track) => prefetchTrackTagsQuery(trpc, track.id))
      )
    )
  )

  return { favoritesOnly, tags, query }
}
