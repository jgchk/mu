import type { RouterInput, TRPCClient } from '$lib/trpc'

export const createTrackQuery = (trpc: TRPCClient, id: number) => trpc.tracks.getById.query({ id })

export const createTracksQuery = (trpc: TRPCClient, ids: number[]) =>
  trpc.tracks.getMany.query({ ids })

export const createFavoriteTrackMutation = (trpc: TRPCClient) =>
  trpc.tracks.favorite.mutation({
    onSuccess: async () => {
      await trpc.tracks.utils.invalidate()
    },
  })

export const createTracksByTagQuery = (
  trpc: TRPCClient,
  input: RouterInput['tracks']['getByTag']
) => trpc.tracks.getByTag.query(input)
