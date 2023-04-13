import type { TRPCClient } from '$lib/trpc'

export const createSystemStatusQuery = (trpc: TRPCClient) => trpc.system.status.query()

export const createStartSoulseekMutation = (trpc: TRPCClient) =>
  trpc.system.startSoulseek.mutation({
    onSuccess: async () => {
      await trpc.system.status.utils.invalidate()
    },
  })

export const createStopSoulseekMutation = (trpc: TRPCClient) =>
  trpc.system.stopSoulseek.mutation({
    onSuccess: async () => {
      await trpc.system.status.utils.invalidate()
    },
  })

export const createRestartSoulseekMutation = (trpc: TRPCClient) =>
  trpc.system.restartSoulseek.mutation({
    onSuccess: async () => {
      await trpc.system.status.utils.invalidate()
    },
  })
