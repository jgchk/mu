import type { TRPCClient } from '$lib/trpc'

export const createRestartSoulseekMutation = (trpc: TRPCClient) =>
  trpc.system.restartSoulseek.mutation()
