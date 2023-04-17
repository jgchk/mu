import { prefetchSearchSpotifyQuery } from '$lib/services/search'
import { fetchSystemStatusQuery } from '$lib/services/system'

import type { PageLoad } from './$types'

export const load: PageLoad = async ({ url, parent }) => {
  const queryParam = url.searchParams.get('q')

  const query = queryParam ?? ''
  const hasQuery = query.length > 0

  if (hasQuery) {
    const { trpc } = await parent()
    const status = await fetchSystemStatusQuery(trpc)

    if (status.spotify.features.webApi) {
      await prefetchSearchSpotifyQuery(trpc, query)
    }
  }

  return { query, hasQuery }
}
