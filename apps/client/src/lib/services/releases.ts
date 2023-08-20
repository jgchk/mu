import type { RouterInput, TRPCClient } from '$lib/trpc'

export const mutateReleaseWithTracksAndArtists = (
  trpc: TRPCClient,
  input: RouterInput['releases']['updateWithTracksAndArtists']
) => trpc.releases.updateWithTracksAndArtists.mutate(input)

export const createReleasesByTagQuery = (trpc: TRPCClient, tagId: number) =>
  trpc.releases.getByTag.query({ tagId })

export const prefetchReleasesByTagQuery = (trpc: TRPCClient, tagId: number) =>
  trpc.releases.getByTag.prefetchQuery({ tagId })

export const createReleaseTracksQuery = (
  trpc: TRPCClient,
  input: RouterInput['releases']['tracks']
) => trpc.releases.tracks.query(input)

export const prefetchReleaseTracksQuery = (
  trpc: TRPCClient,
  input: RouterInput['releases']['tracks']
) => trpc.releases.tracks.prefetchQuery(input)

export const fetchReleaseTracksQuery = (
  trpc: TRPCClient,
  input: RouterInput['releases']['tracks']
) => trpc.releases.tracks.fetchQuery(input)
