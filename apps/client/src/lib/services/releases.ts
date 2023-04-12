import type { TRPCClient } from '$lib/trpc'

export const getReleaseWithTracksAndArtistsQuery = (trpc: TRPCClient, id: number) =>
  trpc.releases.getWithTracksAndArtists.query({ id })
