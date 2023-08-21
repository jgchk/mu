import type { PageLoad } from './$types'

export const load: PageLoad = async ({ parent, data }) => {
  const { trpc } = await parent()
  await trpc.artists.getAll.prefetchQuery({})
  return data
}
