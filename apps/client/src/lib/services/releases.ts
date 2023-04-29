import type { RouterInput, TRPCClient } from '$lib/trpc'

export const createReleaseWithArtistsQuery = (trpc: TRPCClient, id: number) =>
  trpc.releases.getWithArtists.query({ id })

export const fetchReleaseWithArtistsQuery = (trpc: TRPCClient, id: number) =>
  trpc.releases.getWithArtists.fetchQuery({ id })

export const prefetchReleaseWithArtistsQuery = (trpc: TRPCClient, id: number) =>
  trpc.releases.getWithArtists.prefetchQuery({ id })

export const createAllReleasesQuery = (trpc: TRPCClient) => trpc.releases.getAll.query()

export const prefetchAllReleasesQuery = (trpc: TRPCClient) => trpc.releases.getAll.prefetchQuery()

export const createAllReleasesWithArtistsQuery = (trpc: TRPCClient) =>
  trpc.releases.getAllWithArtists.query()

export const prefetchAllReleasesWithArtistsQuery = (trpc: TRPCClient) =>
  trpc.releases.getAllWithArtists.prefetchQuery()

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
