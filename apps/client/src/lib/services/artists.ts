import type { RouterInput, RouterOptions, TRPCClient } from '$lib/trpc'

export const createArtistQuery = (trpc: TRPCClient, id: number) => trpc.artists.get.query({ id })

export const prefetchArtistQuery = (trpc: TRPCClient, id: number) =>
  trpc.artists.get.prefetchQuery({ id })

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
      const [data] = args
      await Promise.all([
        trpc.artists.get.utils.invalidate({ id: data.id }),
        trpc.artists.getAll.utils.invalidate(),
        options?.onSuccess?.(...args),
      ])
    },
  })

export const createArtistReleasesQuery = (trpc: TRPCClient, id: number) =>
  trpc.artists.releases.query({ id })

export const prefetchArtistReleasesQuery = (trpc: TRPCClient, id: number) =>
  trpc.artists.releases.prefetchQuery({ id })

export const createArtistTracksQuery = (
  trpc: TRPCClient,
  input: RouterInput['artists']['tracks']
) => trpc.artists.tracks.query(input)

export const prefetchArtistTracksQuery = (
  trpc: TRPCClient,
  input: RouterInput['artists']['tracks']
) => trpc.artists.tracks.prefetchQuery(input)
