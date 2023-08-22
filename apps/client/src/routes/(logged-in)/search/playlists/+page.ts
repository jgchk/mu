import type { PageLoad } from './$types'

export const load: PageLoad = async ({ url, parent }) => {
  const queryParam = url.searchParams.get('q')
  const name = queryParam ?? ''

  const { trpc } = await parent()
  await trpc.playlists.getAll.prefetchQuery({ name })

  return { name }
}
