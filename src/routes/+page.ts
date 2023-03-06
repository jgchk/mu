import type { PageLoad } from './$types'

export const load = (async ({ parent }) => {
  const { trpc } = await parent()
  await trpc.ping.prefetchQuery()
}) satisfies PageLoad
