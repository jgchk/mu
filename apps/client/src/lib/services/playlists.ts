import type { RouterInput, RouterOptions, TRPCClient } from '$lib/trpc'

export const createPlaylistsQuery = (
  trpc: TRPCClient,
  input?: RouterInput['playlists']['getAll']
) => trpc.playlists.getAll.query(input ?? {})

export const prefetchPlaylistsQuery = (
  trpc: TRPCClient,
  input?: RouterInput['playlists']['getAll']
) => trpc.playlists.getAll.prefetchQuery(input ?? {})

export const createPlaylistsHasTrackQuery = (trpc: TRPCClient, trackId: number) =>
  trpc.playlists.getAllHasTrack.query({ trackId })

export const createPlaylistQuery = (trpc: TRPCClient, id: number) =>
  trpc.playlists.getWithTracks.query({ id })

export const prefetchPlaylistQuery = (trpc: TRPCClient, id: number) =>
  trpc.playlists.getWithTracks.prefetchQuery({ id })

export const fetchPlaylistQuery = (trpc: TRPCClient, id: number) =>
  trpc.playlists.getWithTracks.fetchQuery({ id })

export const createNewPlaylistMutation = (
  trpc: TRPCClient,
  options?: RouterOptions['playlists']['new']
) =>
  trpc.playlists.new.mutation({
    ...options,
    onSuccess: async (...args) => {
      await Promise.all([
        trpc.playlists.getAll.utils.invalidate(),
        trpc.playlists.getAllHasTrack.utils.invalidate(),
        options?.onSuccess?.(...args),
      ])
    },
  })

export const createAddTrackToPlaylistMutation = (
  trpc: TRPCClient,
  options?: RouterOptions['playlists']['addTrack']
) =>
  trpc.playlists.addTrack.mutation({
    ...options,
    onSuccess: async (...args) => {
      await Promise.all([
        trpc.playlists.getWithTracks.utils.setData({ id: args[0].id }, args[0]),
        trpc.playlists.getAll.utils.invalidate(),
        trpc.playlists.getAllHasTrack.utils.invalidate(),
        options?.onSuccess?.(...args),
      ])
    },
  })

export const createRemoveTrackFromPlaylistMutation = (
  trpc: TRPCClient,
  options?: RouterOptions['playlists']['removeTrack']
) =>
  trpc.playlists.removeTrack.mutation({
    ...options,
    onMutate: async (input) => {
      await trpc.playlists.getWithTracks.utils.cancel({ id: input.playlistId })

      const previousPlaylist = trpc.playlists.getWithTracks.utils.getData({
        id: input.playlistId,
      })

      trpc.playlists.getWithTracks.utils.setData({ id: input.playlistId }, (old) => {
        if (!old) return old

        return {
          ...old,
          tracks: old.tracks.filter((track) => track.id !== input.playlistTrackId),
        }
      })

      return { previousPlaylist }
    },
    onError: (err, input, context) => {
      trpc.playlists.getWithTracks.utils.setData(
        { id: input.playlistId },
        context?.previousPlaylist
      )
    },
    onSuccess: async (...args) => {
      await Promise.all([
        trpc.playlists.getWithTracks.utils.invalidate({ id: args[0].id }),
        trpc.playlists.getAll.utils.invalidate(),
        trpc.playlists.getAllHasTrack.utils.invalidate(),
        options?.onSuccess?.(...args),
      ])
    },
  })

export const createEditPlaylistMutation = (
  trpc: TRPCClient,
  options?: RouterOptions['playlists']['edit']
) =>
  trpc.playlists.edit.mutation({
    ...options,
    onSuccess: async (...args) => {
      await Promise.all([
        trpc.playlists.getWithTracks.utils.invalidate({ id: args[0].id }),
        trpc.playlists.getAll.utils.invalidate(),
        trpc.playlists.getAllHasTrack.utils.invalidate(),
        options?.onSuccess?.(...args),
      ])
    },
  })

export const createEditPlaylistTrackOrderMutation = (
  trpc: TRPCClient,
  options?: RouterOptions['playlists']['editTrackOrder']
) =>
  trpc.playlists.editTrackOrder.mutation({
    ...options,
    onMutate: async (input) => {
      await trpc.playlists.getWithTracks.utils.cancel({ id: input.playlistId })

      const previousPlaylist = trpc.playlists.getWithTracks.utils.getData({
        id: input.playlistId,
      })

      trpc.playlists.getWithTracks.utils.setData({ id: input.playlistId }, (old) => {
        if (!old) return old

        const getTrackOrder = (id: number) => input.trackIds.indexOf(id) + 1

        return {
          ...old,
          tracks: old.tracks.sort((a, b) => getTrackOrder(a.id) - getTrackOrder(b.id)),
        }
      })

      return { previousPlaylist }
    },
    onError: (err, input, context) => {
      trpc.playlists.getWithTracks.utils.setData(
        { id: input.playlistId },
        context?.previousPlaylist
      )
    },
    onSuccess: async (...args) => {
      await Promise.all([
        trpc.playlists.getWithTracks.utils.invalidate({ id: args[0].id }),
        trpc.playlists.getAll.utils.invalidate(),
        trpc.playlists.getAllHasTrack.utils.invalidate(),
        options?.onSuccess?.(...args),
      ])
    },
  })

export const createDeletePlaylistMutation = (
  trpc: TRPCClient,
  options?: RouterOptions['playlists']['delete']
) =>
  trpc.playlists.delete.mutation({
    ...options,
    onSuccess: async (...args) => {
      await Promise.all([
        trpc.playlists.getAll.utils.invalidate(),
        trpc.playlists.getAllHasTrack.utils.invalidate(),
        options?.onSuccess?.(...args),
      ])
    },
  })
