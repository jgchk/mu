import type { RouterInput } from '$lib/trpc'

import type { PageLoad } from './$types'

export const load: PageLoad = async ({ parent }) => {
  const { trpc, searchQuery } = await parent()

  const query: RouterInput['releases']['getAll'] = {
    title: searchQuery,
    limit: 100,
  }

  await trpc.releases.getAll.prefetchInfiniteQuery(query)

  return { query }
}
