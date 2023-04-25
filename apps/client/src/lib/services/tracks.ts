import type { InfiniteData } from '@tanstack/svelte-query'

import type { RouterInput, RouterOutput, TRPCClient } from '$lib/trpc'

export const createTrackQuery = (trpc: TRPCClient, id: number) => trpc.tracks.getById.query({ id })

export const prefetchTrackQuery = (trpc: TRPCClient, id: number) =>
  trpc.tracks.getById.prefetchQuery({ id })

export const createTracksQuery = (trpc: TRPCClient, ids: number[]) =>
  trpc.tracks.getMany.query({ ids })

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

export const createFavoriteTrackMutation = (
  trpc: TRPCClient,
  optimistic?: {
    getTrackByIdQuery?: RouterInput['tracks']['getById']
    getManyTracksQuery?: RouterInput['tracks']['getMany']
    getAllTracksWithArtistsAndReleaseQuery?: Omit<
      RouterInput['tracks']['getAllWithArtistsAndRelease'],
      'cursor'
    >
    getReleaseWithTracksAndArtistsQuery?: RouterInput['releases']['getWithTracksAndArtists']
    getPlaylistTracksQuery?: RouterInput['playlists']['tracks']
    getFullArtistQuery?: RouterInput['artists']['getFull']
    getTracksByTagQuery?: RouterInput['tracks']['getByTag']
  }
) =>
  trpc.tracks.favorite.mutation({
    onMutate: async (input) => {
      const output: {
        getTrackByIdQuery?: RouterOutput['tracks']['getById']
        getManyTracksQuery?: RouterOutput['tracks']['getMany']
        getAllTracksWithArtistsAndReleaseQuery?: InfiniteData<
          RouterOutput['tracks']['getAllWithArtistsAndRelease']
        >
        getReleaseWithTracksAndArtistsQuery?: RouterOutput['releases']['getWithTracksAndArtists']
        getPlaylistTracksQuery?: RouterOutput['playlists']['tracks']
        getFullArtistQuery?: RouterOutput['artists']['getFull']
        getTracksByTagQuery?: RouterOutput['tracks']['getByTag']
      } = {}

      if (optimistic?.getTrackByIdQuery) {
        await trpc.tracks.getById.utils.cancel(optimistic.getTrackByIdQuery)

        output.getTrackByIdQuery = trpc.tracks.getById.utils.getData(optimistic.getTrackByIdQuery)

        trpc.tracks.getById.utils.setData(optimistic.getTrackByIdQuery, (old) =>
          old ? { ...old, favorite: input.favorite } : old
        )
      }

      if (optimistic?.getManyTracksQuery) {
        await trpc.tracks.getMany.utils.cancel(optimistic.getManyTracksQuery)

        output.getManyTracksQuery = trpc.tracks.getMany.utils.getData(optimistic.getManyTracksQuery)

        trpc.tracks.getMany.utils.setData(optimistic.getManyTracksQuery, (old) =>
          old
            ? old.map((track) =>
                track.id === input.id ? { ...track, favorite: input.favorite } : track
              )
            : old
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

      if (optimistic?.getPlaylistTracksQuery) {
        await trpc.playlists.tracks.utils.cancel(optimistic.getPlaylistTracksQuery)

        output.getPlaylistTracksQuery = trpc.playlists.tracks.utils.getData(
          optimistic.getPlaylistTracksQuery
        )

        trpc.playlists.tracks.utils.setData(optimistic.getPlaylistTracksQuery, (old) =>
          old
            ? old.map((track) =>
                track.id === input.id ? { ...track, favorite: input.favorite } : track
              )
            : old
        )
      }

      if (optimistic?.getFullArtistQuery) {
        await trpc.artists.getFull.utils.cancel(optimistic.getFullArtistQuery)

        output.getFullArtistQuery = trpc.artists.getFull.utils.getData(
          optimistic.getFullArtistQuery
        )

        trpc.artists.getFull.utils.setData(optimistic.getFullArtistQuery, (old) =>
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

      if (optimistic?.getTracksByTagQuery) {
        await trpc.tracks.getByTag.utils.cancel(optimistic.getTracksByTagQuery)

        output.getTracksByTagQuery = trpc.tracks.getByTag.utils.getData(
          optimistic.getTracksByTagQuery
        )

        trpc.tracks.getByTag.utils.setData(optimistic.getTracksByTagQuery, (old) =>
          old
            ? old.map((track) =>
                track.id === input.id ? { ...track, favorite: input.favorite } : track
              )
            : old
        )
      }

      return output
    },
    onError: (err, input, context) => {
      if (optimistic?.getTrackByIdQuery) {
        trpc.tracks.getById.utils.setData(optimistic.getTrackByIdQuery, context?.getTrackByIdQuery)
      }

      if (optimistic?.getManyTracksQuery) {
        trpc.tracks.getMany.utils.setData(
          optimistic.getManyTracksQuery,
          context?.getManyTracksQuery
        )
      }

      if (optimistic?.getAllTracksWithArtistsAndReleaseQuery) {
        trpc.tracks.getAllWithArtistsAndRelease.utils.setInfiniteData(
          optimistic.getAllTracksWithArtistsAndReleaseQuery,
          context?.getAllTracksWithArtistsAndReleaseQuery
        )
      }

      if (optimistic?.getReleaseWithTracksAndArtistsQuery) {
        trpc.releases.getWithTracksAndArtists.utils.setData(
          optimistic.getReleaseWithTracksAndArtistsQuery,
          context?.getReleaseWithTracksAndArtistsQuery
        )
      }

      if (optimistic?.getPlaylistTracksQuery) {
        trpc.playlists.tracks.utils.setData(
          optimistic.getPlaylistTracksQuery,
          context?.getPlaylistTracksQuery
        )
      }

      if (optimistic?.getFullArtistQuery) {
        trpc.artists.getFull.utils.setData(
          optimistic.getFullArtistQuery,
          context?.getFullArtistQuery
        )
      }

      if (optimistic?.getTracksByTagQuery) {
        trpc.tracks.getByTag.utils.setData(
          optimistic.getTracksByTagQuery,
          context?.getTracksByTagQuery
        )
      }
    },
    onSuccess: async () => {
      await Promise.all([
        trpc.tracks.getById.utils.invalidate(optimistic?.getTrackByIdQuery),
        trpc.tracks.getMany.utils.invalidate(optimistic?.getManyTracksQuery),
        trpc.tracks.getAllWithArtistsAndRelease.utils.invalidate(
          optimistic?.getAllTracksWithArtistsAndReleaseQuery
        ),
        trpc.releases.getWithTracksAndArtists.utils.invalidate(
          optimistic?.getReleaseWithTracksAndArtistsQuery
        ),
        trpc.playlists.tracks.utils.invalidate(optimistic?.getPlaylistTracksQuery),
        trpc.artists.getFull.utils.invalidate(optimistic?.getFullArtistQuery),
        trpc.tracks.getByTag.utils.invalidate(optimistic?.getTracksByTagQuery),
      ])
    },
  })

export const createTracksByTagQuery = (trpc: TRPCClient, tagId: number) =>
  trpc.tracks.getByTag.query({ tagId })

export const prefetchTracksByTagQuery = (trpc: TRPCClient, tagId: number) =>
  trpc.tracks.getByTag.prefetchQuery({ tagId })
