import { prefetchPlaylistsQuery } from '$lib/services/playlists'

import type { PageLoad } from './$types'

export const load: PageLoad = async ({ parent }) => {
  const { trpc } = await parent()
  await prefetchPlaylistsQuery(trpc)
}
