import type { PageLoad } from './$types'
import { tracksQueryInput } from './common'

export const load: PageLoad = async ({ parent }) => {
  const { trpc } = await parent()
  await trpc.tracks.getAllWithArtistsAndRelease.prefetchInfiniteQuery(tracksQueryInput)
}
