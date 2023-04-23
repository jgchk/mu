import type { RouterOptions, TRPCClient } from '$lib/trpc'

export const createTagsQuery = (trpc: TRPCClient, options?: RouterOptions['tags']['getAll']) =>
  trpc.tags.getAll.query(undefined, options)

export const createTagMutation = (trpc: TRPCClient, options?: RouterOptions['tags']['add']) =>
  trpc.tags.add.mutation({
    ...options,
    onSuccess: async (...args) => {
      await Promise.all([trpc.tags.getAll.utils.invalidate(), options?.onSuccess?.(...args)])
    },
  })
