import { prefetchSearchSoundcloudQuery } from '$lib/services/search'
import { fetchSystemStatusQuery } from '$lib/services/system'

import type { PageLoad } from './$types'

export const load: PageLoad = async ({ parent }) => {
  const { trpc, searchQuery } = await parent()

  const query = searchQuery ?? ''
  const hasQuery = query.length > 0

  if (hasQuery) {
    const status = await fetchSystemStatusQuery(trpc)

    if (status.soundcloud.status === 'running') {
      await prefetchSearchSoundcloudQuery(trpc, query)
    }
  }

  return { query, hasQuery }
}
