import { prefetchFullArtistQuery } from '$lib/services/artists'
import { paramNumber } from '$lib/utils/params'

import type { PageLoad } from './$types'

export const load: PageLoad = async ({ parent, params }) => {
  const id = paramNumber(params.id, 'Release ID must be a number')

  const { trpc } = await parent()
  await prefetchFullArtistQuery(trpc, id)

  return { id }
}
