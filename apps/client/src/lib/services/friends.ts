import type { RouterOptions, TRPCClient } from '$lib/trpc'

export const createLastFmFriendsQuery = (
  trpc: TRPCClient,
  opts?: RouterOptions['friends']['lastFm']
) =>
  trpc.friends.lastFm.query(undefined, {
    ...opts,
    refetchInterval: opts?.refetchInterval ?? 1000 * 60,
    staleTime: opts?.staleTime ?? 1000 * 10,
  })

export const createSpotifyFriendsQuery = (
  trpc: TRPCClient,
  opts?: RouterOptions['friends']['spotify']
) =>
  trpc.friends.spotify.query(undefined, {
    ...opts,
    refetchInterval: opts?.refetchInterval ?? 1000 * 60,
    staleTime: opts?.staleTime ?? 1000 * 10,
  })
