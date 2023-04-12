import type { PageLoad } from './$types'
import { makeTracksQueryInput } from './common'

export const load: PageLoad = async ({ parent, url }) => {
  const favoritesParam = url.searchParams.get('favorites')
  const favoritesOnly = favoritesParam !== null

  const { trpc } = await parent()
  await trpc.tracks.getAllWithArtistsAndRelease.prefetchInfiniteQuery(
    makeTracksQueryInput(favoritesOnly)
  )

  return { favoritesOnly }
}
