import { prefetchTagsTreeQuery } from '$lib/services/tags'
import { paramNumber } from '$lib/utils/params'

import type { PageLoad } from './$types'

export const load: PageLoad = async ({ params, parent }) => {
  const id = paramNumber(params.id, 'Tag ID must be a number')

  const { trpc } = await parent()
  await prefetchTagsTreeQuery(trpc)

  return { id }
}
