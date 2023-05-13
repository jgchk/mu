import { prefetchTagsTreeQuery } from '$lib/services/tags'

import type { PageLoad } from './$types'

export const load: PageLoad = async ({ parent }) => {
  const { trpc } = await parent()
  await prefetchTagsTreeQuery(trpc)
}
