import { prefetchTrackQuery } from '$lib/services/tracks'
import { paramNumber } from '$lib/utils/params'

import type { PageLoad } from './$types'

export const load: PageLoad = async ({ parent, params }) => {
  const id = paramNumber(params.id, 'Track ID must be a number')

  const { trpc } = await parent()
  await prefetchTrackQuery(trpc, id)

  return { id }
}
