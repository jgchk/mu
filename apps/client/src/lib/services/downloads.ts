import type { TRPCClient } from '$lib/trpc'

export const createAllDownloadsQuery = (trpc: TRPCClient) =>
  trpc.downloads.getAll.query(undefined, { refetchInterval: 1000 })

export const prefetchAllDownloadsQuery = (trpc: TRPCClient) => trpc.downloads.getAll.prefetchQuery()

export const createDownloadMutation = (trpc: TRPCClient) =>
  trpc.downloads.download.mutation({ onSuccess: () => trpc.downloads.getAll.utils.invalidate() })
