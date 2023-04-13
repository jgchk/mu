import type { RouterOptions, TRPCClient } from '$lib/trpc'

export const createSystemStatusQuery = (
  trpc: TRPCClient,
  options?: RouterOptions['system']['status']
) => trpc.system.status.query(undefined, options)

export const createStartSoulseekMutation = (trpc: TRPCClient) =>
  trpc.system.startSoulseek.mutation({
    onSettled: async () => {
      await trpc.system.status.utils.invalidate()
    },
  })

export const createStopSoulseekMutation = (trpc: TRPCClient) =>
  trpc.system.stopSoulseek.mutation({
    onSettled: async () => {
      await trpc.system.status.utils.invalidate()
    },
  })

export const createRestartSoulseekMutation = (trpc: TRPCClient) =>
  trpc.system.restartSoulseek.mutation({
    onSettled: async () => {
      await trpc.system.status.utils.invalidate()
    },
  })
