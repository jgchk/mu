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
  trpc.playlists.get.query({ id })

export const prefetchPlaylistQuery = (trpc: TRPCClient, id: number) =>
  trpc.playlists.get.prefetchQuery({ id })

export const fetchPlaylistQuery = (trpc: TRPCClient, id: number) =>
  trpc.playlists.get.fetchQuery({ id })

export const createPlaylistTracksQuery = (
  trpc: TRPCClient,
  input: RouterInput['playlists']['tracks']
) => trpc.playlists.tracks.query(input)

export const prefetchPlaylistTracksQuery = (
  trpc: TRPCClient,
  input: RouterInput['playlists']['tracks']
) => trpc.playlists.tracks.prefetchQuery(input)

export const fetchPlaylistTracksQuery = (
  trpc: TRPCClient,
  input: RouterInput['playlists']['tracks']
) => trpc.playlists.tracks.fetchQuery(input)

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
      const [data, input] = args
      await Promise.all([
        trpc.playlists.get.utils.invalidate({ id: input.playlistId }),
        trpc.playlists.tracks.utils.setData({ id: input.playlistId }, data),
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
      await trpc.playlists.tracks.utils.cancel({ id: input.playlistId })

      const previousPlaylist = trpc.playlists.tracks.utils.getData({
        id: input.playlistId,
      })

      trpc.playlists.tracks.utils.setData({ id: input.playlistId }, (old) => {
        if (!old) return old

        return old.filter((track) => track.id !== input.playlistTrackId)
      })

      return { previousPlaylist }
    },
    onError: (err, input, context) => {
      trpc.playlists.tracks.utils.setData({ id: input.playlistId }, context?.previousPlaylist)
    },
    onSuccess: async (...args) => {
      const [, input] = args
      await Promise.all([
        trpc.playlists.get.utils.invalidate({ id: input.playlistId }),
        trpc.playlists.tracks.utils.invalidate({ id: input.playlistId }),
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
        trpc.playlists.get.utils.invalidate({ id: args[0].id }),
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
      await trpc.playlists.tracks.utils.cancel({ id: input.playlistId })

      const previousPlaylist = trpc.playlists.tracks.utils.getData({
        id: input.playlistId,
      })

      trpc.playlists.tracks.utils.setData({ id: input.playlistId }, (old) => {
        if (!old) return old

        const getTrackOrder = (id: number) => input.trackIds.indexOf(id) + 1

        return old.sort((a, b) => getTrackOrder(a.id) - getTrackOrder(b.id))
      })

      return { previousPlaylist }
    },
    onError: (err, input, context) => {
      trpc.playlists.tracks.utils.setData({ id: input.playlistId }, context?.previousPlaylist)
    },
    onSuccess: async (...args) => {
      await Promise.all([
        trpc.playlists.get.utils.invalidate({ id: args[0].id }),
        trpc.playlists.tracks.utils.invalidate({ id: args[0].id }),
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
