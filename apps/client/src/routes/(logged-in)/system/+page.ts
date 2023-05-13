import { prefetchSystemStatusQuery } from '$lib/services/system'

import type { PageLoad } from './$types'

export const load: PageLoad = async ({ parent }) => {
  const { trpc } = await parent()
  await prefetchSystemStatusQuery(trpc)
}
