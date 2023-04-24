import type { RouterInput } from '$lib/trpc'

import type { PageData } from './$types'

export const baseTracksQueryInput = { limit: 100 }
export const makeTracksQueryInput = (
  opts?: Pick<PageData, 'favoritesOnly' | 'tags'>
): RouterInput['tracks']['getAllWithArtistsAndRelease'] => ({
  ...baseTracksQueryInput,
  ...(opts?.favoritesOnly ? { favorite: true } : {}),
  ...(opts?.tags !== undefined ? { tags: opts.tags.text } : {}),
})
