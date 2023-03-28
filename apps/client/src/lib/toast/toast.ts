import { getContext, setContext } from 'svelte'
import type { Writable } from 'svelte/store'
import { writable } from 'svelte/store'

export const ToastDefaults = {
  duration: 4000,
} as const

export type Toast = {
  id: number
  msg: string
} & ToastOptions

export type ToastOptions = {
  duration?: number
  variant?: ToastVariant
}

export type ToastVariant = 'info' | 'success' | 'error' | 'warning'

export type ToastStore = Writable<Toast[]> & {
  show: ShowFunc
  success: ShowFunc
  error: ShowFunc
  warning: ShowFunc
  hide: HideFunc
}
type ShowFunc = (msg: string, options?: ToastOptions) => number
type HideFunc = (id: number) => void

const toastContextKey = Symbol('toast-context')
export const setContextToast = (toast = createToast()) => setContext(toastContextKey, toast)
export const getContextToast = () => getContext<ToastStore>(toastContextKey)

export const createToast = (): ToastStore => {
  let lastId = 0
  const store = writable<Toast[]>([])

  const show: ShowFunc = (msg, options) => {
    const id = lastId++
    const toast: Toast = { id, msg, ...options }
    store.update((toasts) => [...toasts, toast])
    return id
  }

  const success: ShowFunc = (msg, options) => {
    return show(msg, { ...options, variant: 'success' })
  }
  const error: ShowFunc = (msg, options) => {
    return show(msg, { ...options, variant: 'error' })
  }
  const warning: ShowFunc = (msg, options) => {
    return show(msg, { ...options, variant: 'warning' })
  }

  const hide: HideFunc = (id) => {
    store.update((toasts) => toasts.filter((t) => t.id !== id))
  }

  return { ...store, show, success, error, warning, hide }
}
