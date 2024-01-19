import type { RouterOptions, TRPCClient } from '$lib/trpc'

export const createArtistQuery = (trpc: TRPCClient, id: number) => trpc.artists.get.query({ id })

export const fetchArtistQuery = (trpc: TRPCClient, id: number) =>
  trpc.artists.get.fetchQuery({ id })

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

export const deleteArtistMutation = (
  trpc: TRPCClient,
  options?: RouterOptions['artists']['delete']
) =>
  trpc.artists.delete.mutation({
    ...options,
    onSuccess: async (...args) => {
      await trpc.artists.getAll.utils.invalidate()
      options?.onSuccess?.(...args)
    },
  })
