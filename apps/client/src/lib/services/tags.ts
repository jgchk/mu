import type { RouterInput, RouterOptions, TRPCClient } from '$lib/trpc'

export const createTagQuery = (trpc: TRPCClient, id: number) => trpc.tags.get.query({ id })

export const createTagsQuery = (
  trpc: TRPCClient,
  input?: RouterInput['tags']['getAll'],
  options?: RouterOptions['tags']['getAll']
) => trpc.tags.getAll.query(input ?? {}, options)

export const createTagsTreeQuery = (
  trpc: TRPCClient,
  options?: RouterOptions['tags']['getAllTree']
) => trpc.tags.getAllTree.query(undefined, options)

export const createNewTagMutation = (trpc: TRPCClient, options?: RouterOptions['tags']['add']) =>
  trpc.tags.add.mutation({
    ...options,
    onSuccess: async (...args) => {
      await Promise.all([
        trpc.tags.getAll.utils.invalidate(),
        trpc.tags.getAllTree.utils.invalidate(),
        options?.onSuccess?.(...args),
      ])
    },
  })

export const createEditTagMutation = (trpc: TRPCClient, options?: RouterOptions['tags']['edit']) =>
  trpc.tags.edit.mutation({
    ...options,
    onSuccess: async (...args) => {
      const [data, input] = args
      await Promise.all([
        trpc.tags.get.utils.setData({ id: input.id }, data),
        trpc.tags.getAll.utils.invalidate(),
        trpc.tags.getAllTree.utils.invalidate(),
        options?.onSuccess?.(...args),
      ])
    },
  })

export const createDeleteTagMutation = (
  trpc: TRPCClient,
  options?: RouterOptions['tags']['delete']
) =>
  trpc.tags.delete.mutation({
    ...options,
    onSuccess: async (...args) => {
      await Promise.all([
        trpc.tags.getAll.utils.invalidate(),
        trpc.tags.getAllTree.utils.invalidate(),
        options?.onSuccess?.(...args),
      ])
    },
  })

export const createReleaseTagsQuery = (trpc: TRPCClient, releaseId: number) =>
  trpc.tags.getByRelease.query({ releaseId })

export const createReleaseTagMutation = (
  trpc: TRPCClient,
  options?: RouterOptions['tags']['tagRelease']
) =>
  trpc.tags.tagRelease.mutation({
    ...options,
    onSuccess: async (...args) => {
      const [data, input] = args
      await Promise.all([
        trpc.tags.getByRelease.utils.setData({ releaseId: input.releaseId }, data.releaseTags),
        ...data.trackIds.map((trackId) => trpc.tags.getByTrack.utils.invalidate({ trackId })),
        trpc.tracks.utils.invalidate(),
        options?.onSuccess?.(...args),
      ])
    },
  })

export const createTrackTagMutation = (
  trpc: TRPCClient,
  options?: RouterOptions['tags']['tagTrack']
) =>
  trpc.tags.tagTrack.mutation({
    ...options,
    onSuccess: async (...args) => {
      const [data, input] = args
      await Promise.all([
        trpc.tags.getByTrack.utils.setData({ trackId: input.trackId }, data),
        trpc.tracks.utils.invalidate(),
        options?.onSuccess?.(...args),
      ])
    },
  })
