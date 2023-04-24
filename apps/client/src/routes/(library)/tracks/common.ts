import type { TrackTagsFilter } from '$lib/tag-filter'
import type { RouterInput } from '$lib/trpc'

export const baseTracksQueryInput = { limit: 100 }
export const makeTracksQueryInput = (opts?: {
  favoritesOnly?: boolean
  tags?: TrackTagsFilter
}): RouterInput['tracks']['getAllWithArtistsAndRelease'] => ({
  ...baseTracksQueryInput,
  ...(opts?.favoritesOnly ? { favorite: true } : {}),
  ...(opts?.tags !== undefined ? { tags: opts.tags } : {}),
})
