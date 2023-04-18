import { getContext, setContext } from 'svelte'
import type { Writable } from 'svelte/store'
import { writable } from 'svelte/store'
import type { AreAllPropsOptional } from 'utils'

export type AllDialogs = {
  'new-playlist': {
    name?: string
    tracks?: number[]
  }
}

export type Dialogs = {
  currentDialog: OpenDialog | undefined
}
export type OpenDialog = {
  [K in keyof AllDialogs]: {
    _tag: K
  } & AllDialogs[K]
}[keyof AllDialogs]

export type OpenFunc<
  K extends keyof AllDialogs = keyof AllDialogs,
  P extends AllDialogs[K] = AllDialogs[K]
> = AreAllPropsOptional<P, (kind: K, params?: P) => void, (kind: K, params: P) => void>

export type DialogsStore = Writable<Dialogs> & {
  open: OpenFunc
  close: (kind: keyof AllDialogs) => void
}

export const createDialogs = (): DialogsStore => {
  const store = writable<Dialogs>({ currentDialog: undefined })
  return {
    ...store,
    open: (kind, params) => {
      store.set({ currentDialog: { _tag: kind, ...params } })
    },
    close: (kind) => {
      store.update((dialogs) => {
        if (dialogs.currentDialog?._tag === kind) {
          return { currentDialog: undefined }
        } else {
          return dialogs
        }
      })
    },
  }
}

const dialogsContextKey = Symbol('dialogs-context')
export const setContextDialogs = (dialogs = createDialogs()) =>
  setContext(dialogsContextKey, dialogs)
export const getContextDialogs = () => getContext<DialogsStore>(dialogsContextKey)
