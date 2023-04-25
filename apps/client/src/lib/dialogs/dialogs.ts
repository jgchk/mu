import type { ComponentProps } from 'svelte'
import { getContext, setContext } from 'svelte'
import type { Writable } from 'svelte/store'
import { writable } from 'svelte/store'
import type { AreAllPropsOptional } from 'utils'

import type AddToPlaylistConfimDuplicateDialog from '$lib/components/AddToPlaylistConfimDuplicateDialog.svelte'
import type DeletePlaylistDialog from '$lib/components/DeletePlaylistDialog.svelte'
import type DeleteTagDialog from '$lib/components/DeleteTagDialog.svelte'
import type EditArtistDialog from '$lib/components/EditArtistDialog.svelte'
import type EditAutoPlaylistDialog from '$lib/components/EditAutoPlaylistDialog.svelte'
import type EditPlaylistDialog from '$lib/components/EditPlaylistDialog.svelte'
import type EditTagDialog from '$lib/components/EditTagDialog.svelte'
import type EditTagsFilterDialog from '$lib/components/EditTagsFilterDialog.svelte'
import type NewAutoPlaylistDialog from '$lib/components/NewAutoPlaylistDialog.svelte'

// eslint-disable-next-line @typescript-eslint/ban-types
type NoProps = {}
export type AllDialogs = {
  'new-playlist': {
    name?: string
    tracks?: number[]
  }
  'new-auto-playlist': ComponentProps<NewAutoPlaylistDialog>
  'confirm-duplicate-playlist-track': ComponentProps<AddToPlaylistConfimDuplicateDialog>
  'edit-playlist': ComponentProps<EditPlaylistDialog>
  'edit-auto-playlist': ComponentProps<EditAutoPlaylistDialog>
  'delete-playlist': ComponentProps<DeletePlaylistDialog>
  'edit-artist': ComponentProps<EditArtistDialog>
  'new-tag': NoProps
  'edit-tag': ComponentProps<EditTagDialog>
  'delete-tag': ComponentProps<DeleteTagDialog>
  'edit-tags-filter': ComponentProps<EditTagsFilterDialog>
}

export type Dialogs = {
  currentDialog: OpenDialog | undefined
}
export type OpenDialog = {
  [K in keyof AllDialogs]: {
    _tag: K
  } & AllDialogs[K]
}[keyof AllDialogs]

export type DialogsStore = Writable<Dialogs> & {
  open: <K extends keyof AllDialogs, P extends AllDialogs[K]>(
    kind: K,
    ...params: AreAllPropsOptional<P, [P?], [P]>
  ) => void
  close: (kind: keyof AllDialogs) => void
}

export const createDialogs = (): DialogsStore => {
  const store = writable<Dialogs>({ currentDialog: undefined })
  return {
    ...store,
    open: (kind, ...params) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - we know better than the compiler :)
      store.set({ currentDialog: { _tag: kind, ...params[0] } })
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
