import type { PageLoad } from './$types'

export const load = (async ({ parent }) => {
  const { trpc } = await parent()
  await trpc.downloads.getAll.prefetchQuery()
}) satisfies PageLoad
