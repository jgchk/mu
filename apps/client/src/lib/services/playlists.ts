import type { RouterOptions, TRPCClient } from '$lib/trpc'

export const createPlaylistsQuery = (trpc: TRPCClient) => trpc.playlists.getAll.query()

export const prefetchPlaylistsQuery = (trpc: TRPCClient) => trpc.playlists.getAll.prefetchQuery()

export const createPlaylistQuery = (trpc: TRPCClient, id: number) =>
  trpc.playlists.getWithTracks.query({ id })

export const prefetchPlaylistQuery = (trpc: TRPCClient, id: number) =>
  trpc.playlists.getWithTracks.prefetchQuery({ id })

export const fetchPlaylistQuery = (trpc: TRPCClient, id: number) =>
  trpc.playlists.getWithTracks.fetchQuery({ id })

export const createNewPlaylistMutation = (
  trpc: TRPCClient,
  options?: RouterOptions['playlists']['add']
) =>
  trpc.playlists.add.mutation({
    ...options,
    onSuccess: async (...args) => {
      await Promise.all([trpc.playlists.getAll.utils.invalidate(), options?.onSuccess?.(...args)])
    },
  })
