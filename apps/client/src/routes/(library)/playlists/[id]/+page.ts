import { prefetchPlaylistQuery } from '$lib/services/playlists'
import { paramNumber } from '$lib/utils/params'

import type { PageLoad } from './$types'

export const load: PageLoad = async ({ parent, params }) => {
  const id = paramNumber(params.id, 'Playlist ID must be a number')

  const { trpc } = await parent()
  await prefetchPlaylistQuery(trpc, id)

  return { id }
}
