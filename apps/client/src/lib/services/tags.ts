import type { RouterOptions, TRPCClient } from '$lib/trpc'

export const createTagQuery = (trpc: TRPCClient, id: number) => trpc.tags.get.query({ id })

export const prefetchTagQuery = (trpc: TRPCClient, id: number) =>
  trpc.tags.get.prefetchQuery({ id })

export const createTagsQuery = (trpc: TRPCClient, options?: RouterOptions['tags']['getAll']) =>
  trpc.tags.getAll.query(undefined, options)

export const createTagsTreeQuery = (
  trpc: TRPCClient,
  options?: RouterOptions['tags']['getAllTree']
) => trpc.tags.getAllTree.query(undefined, options)

export const prefetchTagsTreeQuery = (trpc: TRPCClient) => trpc.tags.getAllTree.prefetchQuery()

export const createTagMutation = (trpc: TRPCClient, options?: RouterOptions['tags']['add']) =>
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

export const createReleaseTagsQuery = (trpc: TRPCClient, releaseId: number) =>
  trpc.tags.getByRelease.query({ releaseId })

export const createAddReleaseTagMutation = (
  trpc: TRPCClient,
  options?: RouterOptions['tags']['addToRelease']
) =>
  trpc.tags.addToRelease.mutation({
    ...options,
    onSuccess: async (...args) => {
      await Promise.all([trpc.tags.getByRelease.utils.invalidate(), options?.onSuccess?.(...args)])
    },
  })
