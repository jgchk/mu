import type { PageLoad } from './$types'

export const load = (async ({ parent }) => {
  const { queryClient, trpc } = await parent()
  await queryClient.prefetchQuery({
    queryKey: ['ping'],
    queryFn: () => trpc.ping.query(),
  })
}) satisfies PageLoad
