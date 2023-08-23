import { prefetchSystemStatusQuery } from '$lib/services/system'

import type { PageLoad } from './$types'

export const load: PageLoad = async ({ parent }) => {
  const { trpc, searchQuery } = await parent()

  const query = searchQuery ?? ''
  const hasQuery = query.length > 0

  await prefetchSystemStatusQuery(trpc)

  return { query, hasQuery }
}
