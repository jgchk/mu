import type { RouterInput, TRPCClient } from '$lib/trpc'

export const createReleaseWithTracksAndArtistsQuery = (trpc: TRPCClient, id: number) =>
  trpc.releases.getWithTracksAndArtists.query({ id })

export const fetchReleaseWithTracksAndArtistsQuery = (trpc: TRPCClient, id: number) =>
  trpc.releases.getWithTracksAndArtists.fetchQuery({ id })

export const prefetchReleaseWithTracksAndArtistsQuery = (trpc: TRPCClient, id: number) =>
  trpc.releases.getWithTracksAndArtists.prefetchQuery({ id })

export const createAllReleasesQuery = (trpc: TRPCClient) => trpc.releases.getAll.query()

export const prefetchAllReleasesQuery = (trpc: TRPCClient) => trpc.releases.getAll.prefetchQuery()

export const fetchReleaseCoverArtQuery = (trpc: TRPCClient, id: number) =>
  trpc.releases.getCoverArt.fetchQuery({ id })

export const mutateReleaseWithTracksAndArtists = (
  trpc: TRPCClient,
  input: RouterInput['releases']['updateWithTracksAndArtists']
) => trpc.releases.updateWithTracksAndArtists.mutate(input)
