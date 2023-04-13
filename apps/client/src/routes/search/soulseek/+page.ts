import { prefetchSystemStatusQuery } from '$lib/services/system'

import type { PageLoad } from './$types'

export const load: PageLoad = async ({ url, parent }) => {
  const queryParam = url.searchParams.get('q')

  const query = queryParam ?? ''
  const hasQuery = query.length > 0

  const { trpc } = await parent()
  await prefetchSystemStatusQuery(trpc)

  return { query, hasQuery }
}
