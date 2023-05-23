import { prefetchAllArtistsQuery } from '$lib/services/artists'

import type { PageLoad } from './$types'

export const load: PageLoad = async ({ parent, data }) => {
  const { trpc } = await parent()
  await prefetchAllArtistsQuery(trpc)
  return data
}
