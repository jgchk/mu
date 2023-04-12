import type { TRPCClient } from '$lib/trpc'

export const createSearchSoulseekSubscription = (trpc: TRPCClient, query: string) =>
  trpc.search.soulseekSubscription.subscription({ query })

export const createSearchSoundcloudQuery = (trpc: TRPCClient, query: string) =>
  trpc.search.soundcloud.query({ query }, { enabled: query.length > 0, staleTime: 60 * 1000 })

export const prefetchSearchSoundcloudQuery = (trpc: TRPCClient, query: string) =>
  trpc.search.soundcloud.prefetchQuery({ query })

export const createSearchSpotifyQuery = (trpc: TRPCClient, query: string) =>
  trpc.search.spotify.query({ query }, { enabled: query.length > 0, staleTime: 60 * 1000 })

export const prefetchSearchSpotifyQuery = (trpc: TRPCClient, query: string) =>
  trpc.search.spotify.prefetchQuery({ query })
