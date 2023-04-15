import type { RouterInput, RouterOptions, TRPCClient } from '$lib/trpc'

export const createSystemStatusQuery = (
  trpc: TRPCClient,
  options?: RouterOptions['system']['status']
) => trpc.system.status.query(undefined, options)

export const prefetchSystemStatusQuery = (trpc: TRPCClient) => trpc.system.status.prefetchQuery()

export const fetchSystemStatusQuery = (trpc: TRPCClient) => trpc.system.status.fetchQuery()

export const createConfigQuery = (trpc: TRPCClient) => trpc.system.config.query()

export const prefetchConfigQuery = (trpc: TRPCClient) => trpc.system.config.prefetchQuery()

export const fetchConfigQuery = (trpc: TRPCClient) => trpc.system.config.fetchQuery()

export const createConfigMutation = (trpc: TRPCClient) => trpc.system.updateConfig.mutation()

export const mutateConfig = (trpc: TRPCClient, input: RouterInput['system']['updateConfig']) =>
  trpc.system.updateConfig.mutate(input)

export const createStartSoulseekMutation = (
  trpc: TRPCClient,
  options?: RouterOptions['system']['startSoulseek']
) =>
  trpc.system.startSoulseek.mutation({
    ...options,
    onSettled: async (...args) => {
      await Promise.all([trpc.system.status.utils.invalidate(), options?.onSettled?.(...args)])
    },
  })

export const createStopSoulseekMutation = (
  trpc: TRPCClient,
  options?: RouterOptions['system']['stopSoulseek']
) =>
  trpc.system.stopSoulseek.mutation({
    ...options,
    onSettled: async (...args) => {
      await Promise.all([trpc.system.status.utils.invalidate(), options?.onSettled?.(...args)])
    },
  })

export const createRestartSoulseekMutation = (
  trpc: TRPCClient,
  options?: RouterOptions['system']['restartSoulseek']
) =>
  trpc.system.restartSoulseek.mutation({
    ...options,
    onSettled: async (...args) => {
      await Promise.all([trpc.system.status.utils.invalidate(), options?.onSettled?.(...args)])
    },
  })

export const createReloadLastFmMutation = (
  trpc: TRPCClient,
  options?: RouterOptions['system']['reloadLastFm']
) =>
  trpc.system.reloadLastFm.mutation({
    ...options,
    onSettled: async (...args) => {
      await Promise.all([trpc.system.status.utils.invalidate(), options?.onSettled?.(...args)])
    },
  })
