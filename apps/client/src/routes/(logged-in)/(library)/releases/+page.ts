import { prefetchAllReleasesWithArtistsQuery } from '$lib/services/releases'

import type { PageLoad } from './$types'

export const load: PageLoad = async ({ parent }) => {
  const { trpc } = await parent()
  await prefetchAllReleasesWithArtistsQuery(trpc)
}
