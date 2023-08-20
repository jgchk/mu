import type { PageLoad } from './$types'

export const load: PageLoad = async ({ url, parent }) => {
  const queryParam = url.searchParams.get('q')
  const title = queryParam ?? ''

  const { trpc } = await parent()
  await trpc.releases.getAll.prefetchQuery({ title })

  return { title }
}
