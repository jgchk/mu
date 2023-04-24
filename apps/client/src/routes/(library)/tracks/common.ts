import type { RouterInput } from '$lib/trpc'

export const baseTracksQueryInput = { limit: 100 }
export const makeTracksQueryInput = (opts?: {
  favoritesOnly?: boolean
  tag?: number
}): RouterInput['tracks']['getAllWithArtistsAndRelease'] => ({
  ...baseTracksQueryInput,
  ...(opts?.favoritesOnly ? { favorite: true } : {}),
  ...(opts?.tag !== undefined ? { tags: opts.tag } : {}),
})
