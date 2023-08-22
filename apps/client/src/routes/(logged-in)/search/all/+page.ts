import { prefetchTrackTagsQuery } from '$lib/services/tags'

import type { PageLoad } from './$types'
import { NUM_TRACKS } from './common'

export const load: PageLoad = async ({ url, parent }) => {
  const queryParam = url.searchParams.get('q')
  const searchQuery = queryParam ?? ''

  const { trpc } = await parent()
  await Promise.all([
    trpc.tracks.getAll
      .fetchQuery({ title: searchQuery, limit: NUM_TRACKS })
      .then((page) =>
        Promise.all(page.items.map((track) => prefetchTrackTagsQuery(trpc, track.id)))
      ),
    trpc.releases.getAll.prefetchQuery({ title: searchQuery }),
    trpc.artists.getAll.prefetchQuery({ name: searchQuery }),
    trpc.playlists.getAll.prefetchQuery({ name: searchQuery }),
  ])

  return { searchQuery }
}
