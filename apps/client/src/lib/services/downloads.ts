import type { TRPCClient } from '$lib/trpc'

export const createAllDownloadsQuery = (trpc: TRPCClient) =>
  trpc.downloads.getAll.query(undefined, { refetchInterval: 1000 })

export const createDownloadMutation = (trpc: TRPCClient) =>
  trpc.downloads.download.mutation({ onSuccess: () => trpc.downloads.getAll.utils.invalidate() })

export const createRetryTrackDownloadMutation = (trpc: TRPCClient) =>
  trpc.downloads.retryTrackDownload.mutation({
    onSuccess: () => trpc.downloads.getAll.utils.invalidate(),
  })

export const createDeleteTrackDownloadMutation = (trpc: TRPCClient) =>
  trpc.downloads.deleteTrackDownload.mutation({
    onSuccess: () => trpc.downloads.getAll.utils.invalidate(),
  })

export const createDeleteGroupDownloadMutation = (trpc: TRPCClient) =>
  trpc.downloads.deleteGroupDownload.mutation({
    onSuccess: () => trpc.downloads.getAll.utils.invalidate(),
  })
