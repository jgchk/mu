import type { TRPCClient } from '$lib/trpc'

export const createAllArtistsQuery = (trpc: TRPCClient) => trpc.artists.getAll.query()
export const prefetchAllArtistsQuery = (trpc: TRPCClient) => trpc.artists.getAll.prefetchQuery()

export const createAddArtistMutation = (trpc: TRPCClient) => trpc.artists.add.mutation()
