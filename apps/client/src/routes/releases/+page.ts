import { prefetchAllReleasesQuery } from '$lib/services/releases'

import type { PageLoad } from './$types'

export const load: PageLoad = async ({ parent }) => {
  const { trpc } = await parent()
  await prefetchAllReleasesQuery(trpc)
}
