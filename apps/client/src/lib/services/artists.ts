import type { RouterOptions, TRPCClient } from '$lib/trpc'

export const createArtistQuery = (trpc: TRPCClient, id: number) => trpc.artists.get.query({ id })

export const createFullArtistQuery = (trpc: TRPCClient, id: number) =>
  trpc.artists.getFull.query({ id })

export const prefetchFullArtistQuery = (trpc: TRPCClient, id: number) =>
  trpc.artists.getFull.prefetchQuery({ id })

export const createAllArtistsQuery = (trpc: TRPCClient) => trpc.artists.getAll.query()

export const prefetchAllArtistsQuery = (trpc: TRPCClient) => trpc.artists.getAll.prefetchQuery()

export const createAddArtistMutation = (trpc: TRPCClient) =>
  trpc.artists.add.mutation({ onSuccess: () => trpc.artists.getAll.utils.invalidate() })

export const createEditArtistMutation = (
  trpc: TRPCClient,
  options?: RouterOptions['artists']['edit']
) =>
  trpc.artists.edit.mutation({
    ...options,
    onSuccess: async (...args) => {
      await Promise.all([
        trpc.artists.get.utils.setData({ id: args[0].id }, args[0]),
        trpc.artists.getFull.utils.invalidate({ id: args[0].id }),
        trpc.artists.getAll.utils.invalidate(),
        options?.onSuccess?.(...args),
      ])
    },
  })

export const createArtistReleasesQuery = (trpc: TRPCClient, id: number) =>
  trpc.artists.releases.query({ id })

export const prefetchArtistReleasesQuery = (trpc: TRPCClient, id: number) =>
  trpc.artists.releases.prefetchQuery({ id })

export const createArtistTracksQuery = (trpc: TRPCClient, id: number) =>
  trpc.artists.tracks.query({ id })

export const prefetchArtistTracksQuery = (trpc: TRPCClient, id: number) =>
  trpc.artists.tracks.prefetchQuery({ id })
