import type { RouterInput, RouterOptions, TRPCClient } from '$lib/trpc'

export const createSystemStatusQuery = (
  trpc: TRPCClient,
  opts?: RouterOptions['system']['status']
) =>
  trpc.system.status.query(undefined, {
    ...opts,
    refetchInterval: (data) =>
      data === undefined
        ? false
        : data.lastFm.status === 'authenticating' ||
          data.lastFm.status === 'logging-in' ||
          data.soulseek.status === 'logging-in'
        ? 1000
        : false,
  })

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

export const createStartLastFmMutation = (
  trpc: TRPCClient,
  options?: RouterOptions['system']['startLastFm']
) =>
  trpc.system.startLastFm.mutation({
    ...options,
    onSettled: async (...args) => {
      await Promise.all([trpc.system.status.utils.invalidate(), options?.onSettled?.(...args)])
    },
  })

export const createStopLastFmMutation = (
  trpc: TRPCClient,
  options?: RouterOptions['system']['stopLastFm']
) =>
  trpc.system.stopLastFm.mutation({
    ...options,
    onSettled: async (...args) => {
      await Promise.all([trpc.system.status.utils.invalidate(), options?.onSettled?.(...args)])
    },
  })

export const createStartSpotifyMutation = (
  trpc: TRPCClient,
  options?: RouterOptions['system']['startSpotify']
) =>
  trpc.system.startSpotify.mutation({
    ...options,
    onSettled: async (...args) => {
      await Promise.all([trpc.system.status.utils.invalidate(), options?.onSettled?.(...args)])
    },
  })

export const createStopSpotifyMutation = (
  trpc: TRPCClient,
  options?: RouterOptions['system']['stopSpotify']
) =>
  trpc.system.stopSpotify.mutation({
    ...options,
    onSettled: async (...args) => {
      await Promise.all([trpc.system.status.utils.invalidate(), options?.onSettled?.(...args)])
    },
  })

export const createStartSoundcloudMutation = (
  trpc: TRPCClient,
  options?: RouterOptions['system']['startSoundcloud']
) =>
  trpc.system.startSoundcloud.mutation({
    ...options,
    onSettled: async (...args) => {
      await Promise.all([trpc.system.status.utils.invalidate(), options?.onSettled?.(...args)])
    },
  })

export const createStopSoundcloudMutation = (
  trpc: TRPCClient,
  options?: RouterOptions['system']['stopSoundcloud']
) =>
  trpc.system.stopSoundcloud.mutation({
    ...options,
    onSettled: async (...args) => {
      await Promise.all([trpc.system.status.utils.invalidate(), options?.onSettled?.(...args)])
    },
  })
