export const baseTracksQueryInput = { limit: 100 }
export const makeTracksQueryInput = (favoritesOnly?: boolean) => ({
  ...baseTracksQueryInput,
  ...(favoritesOnly ? { favorite: true } : {}),
})
