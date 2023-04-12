import type { InfiniteData } from '@tanstack/svelte-query'

import type { RouterInput, RouterOutput, TRPCClient } from '$lib/trpc'

export const createTrackQuery = (trpc: TRPCClient, id: number) => trpc.tracks.getById.query({ id })

export const prefetchTrackQuery = (trpc: TRPCClient, id: number) =>
  trpc.tracks.getById.prefetchQuery({ id })

export const createAllTracksWithArtistsAndReleaseQuery = (
  trpc: TRPCClient,
  input: Omit<RouterInput['tracks']['getAllWithArtistsAndRelease'], 'cursor'>
) =>
  trpc.tracks.getAllWithArtistsAndRelease.infiniteQuery(input, {
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  })

export const prefetchAllTracksWithArtistsAndReleaseQuery = (
  trpc: TRPCClient,
  input: Omit<RouterInput['tracks']['getAllWithArtistsAndRelease'], 'cursor'>
) => trpc.tracks.getAllWithArtistsAndRelease.prefetchInfiniteQuery(input)

export const createUpdateTrackMetadataMutation = (trpc: TRPCClient) =>
  trpc.tracks.updateMetadata.mutation()

export const createFavoriteTrackMutation = (
  trpc: TRPCClient,
  optimistic?: {
    getTrackByIdQuery?: RouterInput['tracks']['getById']
    getAllTracksWithArtistsAndReleaseQuery?: Omit<
      RouterInput['tracks']['getAllWithArtistsAndRelease'],
      'cursor'
    >
    getReleaseWithTracksAndArtistsQuery?: RouterInput['releases']['getWithTracksAndArtists']
  }
) =>
  trpc.tracks.favorite.mutation({
    onMutate: async (input) => {
      const output: {
        getTrackByIdQuery?: RouterOutput['tracks']['getById']
        getAllTracksWithArtistsAndReleaseQuery?: InfiniteData<
          RouterOutput['tracks']['getAllWithArtistsAndRelease']
        >
        getReleaseWithTracksAndArtistsQuery?: RouterOutput['releases']['getWithTracksAndArtists']
      } = {}

      if (optimistic?.getTrackByIdQuery) {
        await trpc.tracks.getById.utils.cancel(optimistic.getTrackByIdQuery)

        output.getTrackByIdQuery = trpc.tracks.getById.utils.getData(optimistic.getTrackByIdQuery)

        trpc.tracks.getById.utils.setData(optimistic.getTrackByIdQuery, (old) =>
          old ? { ...old, favorite: input.favorite } : old
        )
      }

      if (optimistic?.getAllTracksWithArtistsAndReleaseQuery) {
        await trpc.tracks.getAllWithArtistsAndRelease.utils.cancel(
          optimistic.getAllTracksWithArtistsAndReleaseQuery
        )

        output.getAllTracksWithArtistsAndReleaseQuery =
          trpc.tracks.getAllWithArtistsAndRelease.utils.getInfiniteData(
            optimistic.getAllTracksWithArtistsAndReleaseQuery
          )

        trpc.tracks.getAllWithArtistsAndRelease.utils.setInfiniteData(
          optimistic.getAllTracksWithArtistsAndReleaseQuery,
          (old) =>
            old
              ? {
                  ...old,
                  pages: old.pages.map((page) => ({
                    ...page,
                    items: page.items.map((track) =>
                      track.id === input.id ? { ...track, favorite: input.favorite } : track
                    ),
                  })),
                }
              : old
        )
      }

      if (optimistic?.getReleaseWithTracksAndArtistsQuery) {
        await trpc.releases.getWithTracksAndArtists.utils.cancel(
          optimistic.getReleaseWithTracksAndArtistsQuery
        )

        output.getReleaseWithTracksAndArtistsQuery =
          trpc.releases.getWithTracksAndArtists.utils.getData(
            optimistic.getReleaseWithTracksAndArtistsQuery
          )

        trpc.releases.getWithTracksAndArtists.utils.setData(
          optimistic.getReleaseWithTracksAndArtistsQuery,
          (old) =>
            old
              ? {
                  ...old,
                  tracks: old.tracks.map((track) =>
                    track.id === input.id ? { ...track, favorite: input.favorite } : track
                  ),
                }
              : old
        )
      }

      return output
    },
    onError: (err, input, context) => {
      if (optimistic?.getTrackByIdQuery && context?.getTrackByIdQuery) {
        trpc.tracks.getById.utils.setData(optimistic.getTrackByIdQuery, context.getTrackByIdQuery)
      }

      if (
        optimistic?.getAllTracksWithArtistsAndReleaseQuery &&
        context?.getAllTracksWithArtistsAndReleaseQuery
      ) {
        trpc.tracks.getAllWithArtistsAndRelease.utils.setInfiniteData(
          optimistic.getAllTracksWithArtistsAndReleaseQuery,
          context.getAllTracksWithArtistsAndReleaseQuery
        )
      }

      if (
        optimistic?.getReleaseWithTracksAndArtistsQuery &&
        context?.getReleaseWithTracksAndArtistsQuery
      ) {
        trpc.releases.getWithTracksAndArtists.utils.setData(
          optimistic.getReleaseWithTracksAndArtistsQuery,
          context.getReleaseWithTracksAndArtistsQuery
        )
      }
    },
    onSuccess: async () => {
      await Promise.all([
        trpc.tracks.getById.utils.invalidate(optimistic?.getTrackByIdQuery),
        trpc.tracks.getAllWithArtistsAndRelease.utils.invalidate(
          optimistic?.getAllTracksWithArtistsAndReleaseQuery
        ),
        trpc.releases.getWithTracksAndArtists.utils.invalidate(
          optimistic?.getReleaseWithTracksAndArtistsQuery
        ),
      ])
    },
  })
