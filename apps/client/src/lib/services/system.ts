import type { ContextSpotifyErrors } from 'trpc'
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

export const prefetchSystemStatusQuery = (trpc: TRPCClient) => trpc.system.status.prefetchQuery()

export const fetchSystemStatusQuery = (trpc: TRPCClient) => trpc.system.status.fetchQuery()

export const createConfigQuery = (trpc: TRPCClient) => trpc.system.config.query()

export const prefetchConfigQuery = (trpc: TRPCClient) => trpc.system.config.prefetchQuery()

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
    toast.success('Soulseek started')
  }
}

export const createStartSoulseekMutation = (
  trpc: TRPCClient,
  options: RouterOptions['system']['startSoulseek'] & { toast: ToastStore | false }
) =>
  trpc.system.startSoulseek.mutation({
    ...(options?.toast
      ? {
          showToast: false,
          onSuccess: (data) => options.toast && notifySoulseekStatus(options.toast, data),
          onError: (error) => options.toast && options.toast.error(soulseekErrorMessage(error)),
        }
      : {}),
    ...options,
    onSettled: async (...args) => {
      await Promise.all([trpc.system.status.utils.invalidate(), options?.onSettled?.(...args)])
    },
  })

export const createStopSoulseekMutation = (
  trpc: TRPCClient,
  options: RouterOptions['system']['stopSoulseek'] & { toast: ToastStore | false }
) =>
  trpc.system.stopSoulseek.mutation({
    ...(options?.toast
      ? {
          showToast: false,
          onSuccess: (data) => options.toast && notifySoulseekStatus(options.toast, data),
          onError: (error) => options.toast && options.toast.error(soulseekErrorMessage(error)),
        }
      : {}),
    ...options,
    onSettled: async (...args) => {
      await Promise.all([trpc.system.status.utils.invalidate(), options?.onSettled?.(...args)])
    },
  })

export const lastFmErrorMessage = (error: unknown) =>
  `Error updating Last.fm: ${toErrorString(error)}`
export const notifyLastFmStatus = (
  toast: ToastStore,
  status: RouterOutput['system']['status']['lastFm']
) => {
  if (status.status === 'stopped') {
    toast.error('Last.fm updated: Not logged in')
  } else if (status.status === 'errored') {
    toast.error(lastFmErrorMessage(status.error))
  } else if (status.status === 'authenticating') {
    toast.warning('Last.fm updated: Authenticating...')
  } else if (status.status === 'authenticated') {
    toast.warning('Last.fm updated: Authenticated')
  } else if (status.status === 'logging-in') {
    toast.warning('Last.fm updated: Logging in...')
  } else if (status.status === 'degraded') {
    toast.warning(`Last.fm updated: Degraded: ${status.error}`)
  } else {
    toast.success('Last.fm updated!')
  }
}

export const createStartLastFmMutation = (
  trpc: TRPCClient,
  options: RouterOptions['system']['startLastFm'] & { toast: ToastStore | false }
) =>
  trpc.system.startLastFm.mutation({
    ...(options?.toast
      ? {
          showToast: false,
          onSuccess: (data) => options.toast && notifyLastFmStatus(options.toast, data),
          onError: (error) => options.toast && options.toast.error(lastFmErrorMessage(error)),
        }
      : {}),
    ...options,
    onSettled: async (...args) => {
      await Promise.all([trpc.system.status.utils.invalidate(), options?.onSettled?.(...args)])
    },
  })

export const createStopLastFmMutation = (
  trpc: TRPCClient,
  options: RouterOptions['system']['stopLastFm'] & { toast: ToastStore | false }
) =>
  trpc.system.stopLastFm.mutation({
    ...(options?.toast
      ? {
          showToast: false,
          onSuccess: (data) => options.toast && notifyLastFmStatus(options.toast, data),
          onError: (error) => options.toast && options.toast.error(lastFmErrorMessage(error)),
        }
      : {}),
    ...options,
    onSettled: async (...args) => {
      await Promise.all([trpc.system.status.utils.invalidate(), options?.onSettled?.(...args)])
    },
  })

export const spotifyErrorMessage = (error: unknown) =>
  `Error updating Spotify: ${toErrorString(error)}`
const formatSpotifyErrors = (errors: ContextSpotifyErrors) =>
  Object.values(errors).filter(isDefined).map(toErrorString).join(', ')
export const notifySpotifyStatus = (
  toast: ToastStore,
  status: RouterOutput['system']['status']['spotify']
) => {
  if (status.status === 'stopped') {
    toast.error('Spotify updated: Stopped')
  } else if (status.status === 'starting') {
    toast.warning('Spotify updated: Starting...')
  } else if (status.status === 'errored') {
    toast.error(`Spotify updated: ${formatSpotifyErrors(status.errors)}`)
  } else if (status.status === 'degraded') {
    toast.warning(`Spotify updated: Degraded: ${formatSpotifyErrors(status.errors)}`)
  } else if (status.status === 'running') {
    toast.success('Spotify updated!')
  }
}

export const createStartSpotifyMutation = (
  trpc: TRPCClient,
  options: RouterOptions['system']['startSpotify'] & { toast: ToastStore | false }
) =>
  trpc.system.startSpotify.mutation({
    ...(options?.toast
      ? {
          showToast: false,
          onSuccess: (data) => options.toast && notifySpotifyStatus(options.toast, data),
          onError: (error) => options.toast && options.toast.error(spotifyErrorMessage(error)),
        }
      : {}),
    ...options,
    onSettled: async (...args) => {
      await Promise.all([trpc.system.status.utils.invalidate(), options?.onSettled?.(...args)])
    },
  })

export const createStopSpotifyMutation = (
  trpc: TRPCClient,
  options: RouterOptions['system']['stopSpotify'] & { toast: ToastStore | false }
) =>
  trpc.system.stopSpotify.mutation({
    ...(options?.toast
      ? {
          showToast: false,
          onSuccess: (data) => options.toast && notifySpotifyStatus(options.toast, data),
          onError: (error) => options.toast && options.toast.error(spotifyErrorMessage(error)),
        }
      : {}),
    ...options,
    onSettled: async (...args) => {
      await Promise.all([trpc.system.status.utils.invalidate(), options?.onSettled?.(...args)])
    },
  })

export const soundcloudErrorMessage = (error: unknown) =>
  `Error updating Soundcloud: ${toErrorString(error)}`
export const notifySoundcloudStatus = (
  toast: ToastStore,
  status: RouterOutput['system']['status']['soundcloud']
) => {
  if (status.status === 'stopped') {
    toast.error('Soundcloud updated: Stopped')
  } else if (status.status === 'starting') {
    toast.warning('Soundcloud updated: Starting...')
  } else if (status.status === 'errored') {
    toast.error(soundcloudErrorMessage(status.error))
  } else if (status.status === 'running') {
    toast.success('Soundcloud updated!')
  }
}

export const createStartSoundcloudMutation = (
  trpc: TRPCClient,
  options: RouterOptions['system']['startSoundcloud'] & { toast: ToastStore | false }
) =>
  trpc.system.startSoundcloud.mutation({
    ...(options?.toast
      ? {
          showToast: false,
          onSuccess: (data) => options.toast && notifySoundcloudStatus(options.toast, data),
          onError: (error) => options.toast && options.toast.error(soundcloudErrorMessage(error)),
        }
      : {}),
    ...options,
    onSettled: async (...args) => {
      await Promise.all([trpc.system.status.utils.invalidate(), options?.onSettled?.(...args)])
    },
  })

export const createStopSoundcloudMutation = (
  trpc: TRPCClient,
  options: RouterOptions['system']['stopSoundcloud'] & { toast: ToastStore | false }
) =>
  trpc.system.stopSoundcloud.mutation({
    ...(options?.toast
      ? {
          showToast: false,
          onSuccess: (data) => options.toast && notifySoundcloudStatus(options.toast, data),
          onError: (error) => options.toast && options.toast.error(soundcloudErrorMessage(error)),
        }
      : {}),
    ...options,
    onSettled: async (...args) => {
      await Promise.all([trpc.system.status.utils.invalidate(), options?.onSettled?.(...args)])
    },
  })
