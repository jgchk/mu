import type { PageLoad } from './$types'

export const load: PageLoad = async ({ url, parent }) => {
  const query = url.searchParams.get('q')

  const { trpc } = await parent()
  await trpc.search.prefetchQuery({ query })

  return { query }
}
