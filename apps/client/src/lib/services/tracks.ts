import type { InfiniteData } from '@tanstack/svelte-query'

import type { RouterInput, RouterOutput, TRPCClient } from '$lib/trpc'

export const createTrackQuery = (trpc: TRPCClient, id: number) => trpc.tracks.getById.query({ id })

export const prefetchTrackQuery = (trpc: TRPCClient, id: number) =>
  trpc.tracks.getById.prefetchQuery({ id })

export const createTracksQuery = (trpc: TRPCClient, ids: number[]) =>
  trpc.tracks.getMany.query({ ids })

export const createFavoriteTrackMutation = (
  trpc: TRPCClient,
  optimistic?: {
    getTrackByIdQuery?: RouterInput['tracks']['getById']
    getManyTracksQuery?: RouterInput['tracks']['getMany']
    getAllTracksQuery?: Omit<RouterInput['tracks']['getAll'], 'cursor'>
    getReleaseTracksQuery?: RouterInput['releases']['tracks']
    getPlaylistTracksQuery?: RouterInput['playlists']['tracks']
    getTracksByTagQuery?: RouterInput['tracks']['getByTag']
  }
) =>
  trpc.tracks.favorite.mutation({
    onMutate: async (input) => {
      const output: {
        getTrackByIdQuery?: RouterOutput['tracks']['getById']
        getManyTracksQuery?: RouterOutput['tracks']['getMany']
        getAllTracksQuery?: InfiniteData<RouterOutput['tracks']['getAll']>
        getReleaseTracksQuery?: RouterOutput['releases']['tracks']
        getPlaylistTracksQuery?: RouterOutput['playlists']['tracks']
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

      if (optimistic?.getAllTracksQuery) {
        await trpc.tracks.getAll.utils.cancel(optimistic.getAllTracksQuery)

        output.getAllTracksQuery = trpc.tracks.getAll.utils.getInfiniteData(
          optimistic.getAllTracksQuery
        )

        trpc.tracks.getAll.utils.setInfiniteData(optimistic.getAllTracksQuery, (old) =>
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

      if (optimistic?.getReleaseTracksQuery) {
        await trpc.releases.tracks.utils.cancel(optimistic.getReleaseTracksQuery)

        output.getReleaseTracksQuery = trpc.releases.tracks.utils.getData(
          optimistic.getReleaseTracksQuery
        )

        trpc.releases.tracks.utils.setData(optimistic.getReleaseTracksQuery, (old) =>
          old
            ? old.map((track) =>
                track.id === input.id ? { ...track, favorite: input.favorite } : track
              )
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

      if (optimistic?.getAllTracksQuery) {
        trpc.tracks.getAll.utils.setInfiniteData(
          optimistic.getAllTracksQuery,
          context?.getAllTracksQuery
        )
      }

      if (optimistic?.getReleaseTracksQuery) {
        trpc.releases.tracks.utils.setData(
          optimistic.getReleaseTracksQuery,
          context?.getReleaseTracksQuery
        )
      }

      if (optimistic?.getPlaylistTracksQuery) {
        trpc.playlists.tracks.utils.setData(
          optimistic.getPlaylistTracksQuery,
          context?.getPlaylistTracksQuery
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
        trpc.tracks.getAll.utils.invalidate(optimistic?.getAllTracksQuery),
        trpc.releases.tracks.utils.invalidate(optimistic?.getReleaseTracksQuery),
        trpc.playlists.tracks.utils.invalidate(optimistic?.getPlaylistTracksQuery),
        trpc.tracks.getByTag.utils.invalidate(optimistic?.getTracksByTagQuery),
      ])
    },
  })

export const createTracksByTagQuery = (
  trpc: TRPCClient,
  input: RouterInput['tracks']['getByTag']
) => trpc.tracks.getByTag.query(input)

export const prefetchTracksByTagQuery = (
  trpc: TRPCClient,
  input: RouterInput['tracks']['getByTag']
) => trpc.tracks.getByTag.prefetchQuery(input)
