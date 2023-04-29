import {
  prefetchArtistReleasesQuery,
  prefetchArtistTracksQuery,
  prefetchFullArtistQuery,
} from '$lib/services/artists'
import { paramNumber } from '$lib/utils/params'

import type { PageLoad } from './$types'

export const load: PageLoad = async ({ parent, params }) => {
  const id = paramNumber(params.id, 'Release ID must be a number')

  const { trpc } = await parent()
  await Promise.all([
    prefetchFullArtistQuery(trpc, id),
    prefetchArtistReleasesQuery(trpc, id),
    prefetchArtistTracksQuery(trpc, id),
  ])

  return { id }
}
