import { prefetchAllDownloadsQuery } from '$lib/services/downloads'

import type { PageLoad } from './$types'

export const load: PageLoad = async ({ parent }) => {
  const { trpc } = await parent()
  await prefetchAllDownloadsQuery(trpc)
}
