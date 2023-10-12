import type { ContextSpotifyErrors } from 'context'
import { isDefined, toErrorString } from 'utils'

import type { ToastStore } from '$lib/toast/toast'
import type { RouterInput, RouterOptions, RouterOutput, TRPCClient } from '$lib/trpc'

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
          data.soulseek.status === 'logging-in' ||
          data.spotify.status === 'starting'
        ? 1000
        : false,
  })

export const fetchSystemStatusQuery = (trpc: TRPCClient) => trpc.system.status.fetchQuery()

export const createConfigQuery = (trpc: TRPCClient) => trpc.system.config.query()

export const fetchConfigQuery = (trpc: TRPCClient) => trpc.system.config.fetchQuery()

export const createConfigMutation = (trpc: TRPCClient) => trpc.system.updateConfig.mutation()

export const mutateConfig = (trpc: TRPCClient, input: RouterInput['system']['updateConfig']) =>
  trpc.system.updateConfig.mutate(input)

export const soulseekErrorMessage = (error: unknown) => `Soulseek errored: ${toErrorString(error)}`
export const notifySoulseekStatus = (
  toast: ToastStore,
  status: RouterOutput['system']['status']['soulseek']
) => {
  if (status.status === 'stopped') {
    toast.error('Soulseek stopped')
  } else if (status.status === 'errored') {
    toast.error(soulseekErrorMessage(status.error))
  } else if (status.status === 'logging-in') {
    toast.warning('Soulseek logging in...')
  } else {
    toast.success('Soulseek started!')
  }
}

export const createStartSoulseekMutation = (
  trpc: TRPCClient,
  options: RouterOptions['system']['startSoulseek'] & { toast: ToastStore | false }
) =>
  trpc.system.startSoulseek.mutation({
    ...(options?.toast ? { showToast: false } : {}),
    ...options,
    onSuccess: async (...args) => {
      const data = args[0]
      trpc.system.status.utils.setData(undefined, (prev) =>
        prev ? { ...prev, soulseek: data } : prev
      )
      if (options.toast) {
        notifySoulseekStatus(options.toast, data)
      }
      await options.onSuccess?.(...args)
    },
    onError: async (...args) => {
      if (options.toast) {
        options.toast.error(soulseekErrorMessage(args[0]))
      }
      await Promise.all([trpc.system.status.utils.invalidate(), options?.onError?.(...args)])
    },
  })

export const createStopSoulseekMutation = (
  trpc: TRPCClient,
  options: RouterOptions['system']['stopSoulseek'] & { toast: ToastStore | false }
) =>
  trpc.system.stopSoulseek.mutation({
    ...(options?.toast ? { showToast: false } : {}),
    ...options,
    onSuccess: async (...args) => {
      const data = args[0]
      trpc.system.status.utils.setData(undefined, (prev) =>
        prev ? { ...prev, soulseek: data } : prev
      )
      if (options.toast) {
        notifySoulseekStatus(options.toast, data)
      }
      await options.onSuccess?.(...args)
    },
    onError: async (...args) => {
      if (options.toast) {
        options.toast.error(soulseekErrorMessage(args[0]))
      }
      await Promise.all([trpc.system.status.utils.invalidate(), options?.onError?.(...args)])
    },
  })

export const lastFmErrorMessage = (error: unknown) => `Last.fm errored: ${toErrorString(error)}`
export const notifyLastFmStatus = (
  toast: ToastStore,
  status: RouterOutput['system']['status']['lastFm']
) => {
  if (status.status === 'stopped') {
    toast.error('Last.fm stopped')
  } else if (status.status === 'errored') {
    toast.error(lastFmErrorMessage(status.error))
  } else if (status.status === 'authenticating') {
    toast.warning('Last.fm authenticating...')
  } else if (status.status === 'authenticated') {
    toast.warning('Last.fm authenticated')
  } else if (status.status === 'logging-in') {
    toast.warning('Last.fm logging in...')
  } else if (status.status === 'degraded') {
    toast.warning(`Last.fm partially authenticated: ${status.error}`)
  } else {
    toast.success('Last.fm started!')
  }
}

export const createStartLastFmMutation = (
  trpc: TRPCClient,
  options: RouterOptions['system']['startLastFm'] & { toast: ToastStore | false }
) =>
  trpc.system.startLastFm.mutation({
    ...(options?.toast ? { showToast: false } : {}),
    ...options,
    onSuccess: async (...args) => {
      const data = args[0]
      trpc.system.status.utils.setData(undefined, (prev) =>
        prev ? { ...prev, lastFm: data } : prev
      )
      if (options.toast) {
        notifyLastFmStatus(options.toast, data)
      }
      await options.onSuccess?.(...args)
    },
    onError: async (...args) => {
      if (options.toast) {
        options.toast.error(lastFmErrorMessage(args[0]))
      }
      await Promise.all([trpc.system.status.utils.invalidate(), options?.onError?.(...args)])
    },
  })

export const createStopLastFmMutation = (
  trpc: TRPCClient,
  options: RouterOptions['system']['stopLastFm'] & { toast: ToastStore | false }
) =>
  trpc.system.stopLastFm.mutation({
    ...(options?.toast ? { showToast: false } : {}),
    ...options,
    onSuccess: async (...args) => {
      const data = args[0]
      trpc.system.status.utils.setData(undefined, (prev) =>
        prev ? { ...prev, lastFm: data } : prev
      )
      if (options.toast) {
        notifyLastFmStatus(options.toast, data)
      }
      await options.onSuccess?.(...args)
    },
    onError: async (...args) => {
      if (options.toast) {
        options.toast.error(lastFmErrorMessage(args[0]))
      }
      await Promise.all([trpc.system.status.utils.invalidate(), options?.onError?.(...args)])
    },
  })

export const spotifyErrorMessage = (error: unknown) => `Spotify errored: ${toErrorString(error)}`
const formatSpotifyErrors = (errors: ContextSpotifyErrors) =>
  Object.values(errors).filter(isDefined).map(toErrorString).join(', ')
export const notifySpotifyStatus = (
  toast: ToastStore,
  status: RouterOutput['system']['status']['spotify']
) => {
  if (status.status === 'stopped') {
    toast.error('Spotify stopped')
  } else if (status.status === 'starting') {
    toast.warning('Spotify starting...')
  } else if (status.status === 'errored') {
    toast.error(`Spotify errored: ${formatSpotifyErrors(status.errors)}`)
  } else if (status.status === 'degraded') {
    toast.warning(`Spotify partially started: ${formatSpotifyErrors(status.errors)}`)
  } else if (status.status === 'running') {
    toast.success('Spotify started!')
  }
}

export const createStartSpotifyMutation = (
  trpc: TRPCClient,
  options: RouterOptions['system']['startSpotify'] & { toast: ToastStore | false }
) =>
  trpc.system.startSpotify.mutation({
    ...(options?.toast ? { showToast: false } : {}),
    ...options,
    onSuccess: async (...args) => {
      const data = args[0]
      trpc.system.status.utils.setData(undefined, (prev) =>
        prev ? { ...prev, spotify: data } : prev
      )
      if (options.toast) {
        notifySpotifyStatus(options.toast, data)
      }
      await options.onSuccess?.(...args)
    },
    onError: async (...args) => {
      if (options.toast) {
        options.toast.error(spotifyErrorMessage(args[0]))
      }
      await Promise.all([trpc.system.status.utils.invalidate(), options?.onError?.(...args)])
    },
  })

export const createStopSpotifyMutation = (
  trpc: TRPCClient,
  options: RouterOptions['system']['stopSpotify'] & { toast: ToastStore | false }
) =>
  trpc.system.stopSpotify.mutation({
    ...(options?.toast ? { showToast: false } : {}),
    ...options,
    onSuccess: async (...args) => {
      const data = args[0]
      trpc.system.status.utils.setData(undefined, (prev) =>
        prev ? { ...prev, spotify: data } : prev
      )
      if (options.toast) {
        notifySpotifyStatus(options.toast, data)
      }
      await options.onSuccess?.(...args)
    },
    onError: async (...args) => {
      if (options.toast) {
        options.toast.error(spotifyErrorMessage(args[0]))
      }
      await Promise.all([trpc.system.status.utils.invalidate(), options?.onError?.(...args)])
    },
  })

export const soundcloudErrorMessage = (error: unknown) =>
  `Soundcloud errored: ${toErrorString(error)}`
export const notifySoundcloudStatus = (
  toast: ToastStore,
  status: RouterOutput['system']['status']['soundcloud']
) => {
  if (status.status === 'stopped') {
    toast.error('Soundcloud stopped')
  } else if (status.status === 'starting') {
    toast.warning('Soundcloud starting...')
  } else if (status.status === 'errored') {
    toast.error(soundcloudErrorMessage(status.error))
  } else if (status.status === 'running') {
    toast.success('Soundcloud started!')
  }
}

export const createStartSoundcloudMutation = (
  trpc: TRPCClient,
  options: RouterOptions['system']['startSoundcloud'] & { toast: ToastStore | false }
) =>
  trpc.system.startSoundcloud.mutation({
    ...(options?.toast ? { showToast: false } : {}),
    ...options,
    onSuccess: async (...args) => {
      const data = args[0]
      trpc.system.status.utils.setData(undefined, (prev) =>
        prev ? { ...prev, soundcloud: data } : prev
      )
      if (options.toast) {
        notifySoundcloudStatus(options.toast, data)
      }
      await options.onSuccess?.(...args)
    },
    onError: async (...args) => {
      if (options.toast) {
        options.toast.error(soundcloudErrorMessage(args[0]))
      }
      await Promise.all([trpc.system.status.utils.invalidate(), options?.onError?.(...args)])
    },
  })

export const createStopSoundcloudMutation = (
  trpc: TRPCClient,
  options: RouterOptions['system']['stopSoundcloud'] & { toast: ToastStore | false }
) =>
  trpc.system.stopSoundcloud.mutation({
    ...(options?.toast ? { showToast: false } : {}),
    ...options,
    onSuccess: async (...args) => {
      const data = args[0]
      trpc.system.status.utils.setData(undefined, (prev) =>
        prev ? { ...prev, soundcloud: data } : prev
      )
      if (options.toast) {
        notifySoundcloudStatus(options.toast, data)
      }
      await options.onSuccess?.(...args)
    },
    onError: async (...args) => {
      if (options.toast) {
        options.toast.error(soundcloudErrorMessage(args[0]))
      }
      await Promise.all([trpc.system.status.utils.invalidate(), options?.onError?.(...args)])
    },
  })
