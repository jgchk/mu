import type { TRPCClient } from '$lib/trpc'

export const createLastFmFriendsQuery = (trpc: TRPCClient) =>
  trpc.friends.lastFm.query(undefined, {
    refetchInterval: 1000 * 60,
    staleTime: 1000 * 10,
  })

export const createSpotifyFriendsQuery = (trpc: TRPCClient) =>
  trpc.friends.spotify.query(undefined, {
    refetchInterval: 1000 * 60,
    staleTime: 1000 * 10,
  })
