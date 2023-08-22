import type { RouterInput, TRPCClient } from '$lib/trpc'

export const mutateReleaseWithTracksAndArtists = (
  trpc: TRPCClient,
  input: RouterInput['releases']['updateWithTracksAndArtists']
) => trpc.releases.updateWithTracksAndArtists.mutate(input)

export const createReleasesByTagQuery = (trpc: TRPCClient, tagId: number) =>
  trpc.releases.getByTag.query({ tagId })

export const prefetchReleasesByTagQuery = (trpc: TRPCClient, tagId: number) =>
  trpc.releases.getByTag.prefetchQuery({ tagId })
