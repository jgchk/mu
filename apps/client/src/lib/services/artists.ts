import type { TRPCClient } from '$lib/trpc'

export const createFullArtistQuery = (trpc: TRPCClient, id: number) =>
  trpc.artists.getFull.query({ id })

export const prefetchFullArtistQuery = (trpc: TRPCClient, id: number) =>
  trpc.artists.getFull.prefetchQuery({ id })

export const createAllArtistsQuery = (trpc: TRPCClient) => trpc.artists.getAll.query()

export const prefetchAllArtistsQuery = (trpc: TRPCClient) => trpc.artists.getAll.prefetchQuery()

export const createAddArtistMutation = (trpc: TRPCClient) =>
  trpc.artists.add.mutation({ onSuccess: () => trpc.artists.getAll.utils.invalidate() })
