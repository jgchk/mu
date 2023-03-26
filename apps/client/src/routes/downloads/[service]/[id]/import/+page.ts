import { paramNumber, paramService } from '$lib/utils/params'

import type { PageLoad } from './$types'

export const load: PageLoad = async ({ parent, params }) => {
  const service = paramService(params.service)
  const id = paramNumber(params.id, 'Download ID must be a number')

  const { trpc } = await parent()
  await trpc.import.groupDownloadData.prefetchQuery({ service, id })

  return { service, id }
}
