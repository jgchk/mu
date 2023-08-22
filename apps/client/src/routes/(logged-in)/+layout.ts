import type { LayoutLoad } from './$types'

export const load: LayoutLoad = ({ url }) => {
  let searchQuery: string | undefined
  if (url.pathname.startsWith('/library')) {
    searchQuery = url.searchParams.get('q') ?? undefined
  }
  return { searchQuery }
}
