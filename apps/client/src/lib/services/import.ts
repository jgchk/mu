import type { RouterInput, TRPCClient } from '$lib/trpc'

export const fetchGroupDownloadDataQuery = (
  trpc: TRPCClient,
  input: RouterInput['import']['groupDownloadData']
) => trpc.import.groupDownloadData.fetchQuery(input)

export const mutateGroupDownloadManual = (
  trpc: TRPCClient,
  input: RouterInput['import']['groupDownloadManual']
) => trpc.import.groupDownloadManual.mutate(input)

export const fetchTrackDownloadDataQuery = (
  trpc: TRPCClient,
  input: RouterInput['import']['trackDownloadData']
) => trpc.import.trackDownloadData.fetchQuery(input)

export const mutateTrackDownloadManual = (
  trpc: TRPCClient,
  input: RouterInput['import']['trackDownloadManual']
) => trpc.import.trackDownloadManual.mutate(input)
