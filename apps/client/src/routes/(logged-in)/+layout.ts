import type { LayoutLoad } from './$types'

export const load: LayoutLoad = ({ url }) => {
  const searchQuery = url.searchParams.get('q') ?? undefined
  return { searchQuery }
}
