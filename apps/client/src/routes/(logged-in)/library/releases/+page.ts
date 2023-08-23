import type { PageLoad } from './$types'

export const load: PageLoad = async ({ parent }) => {
  const { trpc, searchQuery } = await parent()
  await trpc.releases.getAll.prefetchQuery({ title: searchQuery })
}
