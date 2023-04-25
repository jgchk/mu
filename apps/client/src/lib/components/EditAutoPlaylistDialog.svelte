<script lang="ts">
  import { decode } from 'bool-lang'
  import { createEventDispatcher } from 'svelte'
  import { ifNotNullOrUndefined, tryOr } from 'utils'
  import { blobToBase64 } from 'utils/browser'

  import Button from '$lib/atoms/Button.svelte'
  import Dialog from '$lib/atoms/Dialog.svelte'
  import { createEditPlaylistMutation } from '$lib/services/playlists'
  import { getContextToast } from '$lib/toast/toast'
  import { getContextClient } from '$lib/trpc'

  import AutoPlaylistDetailsForm from './AutoPlaylistDetailsForm.svelte'

  const dispatch = createEventDispatcher<{ close: undefined }>()
  const close = () => dispatch('close')

  export let playlist: {
    id: number
    name: string
    description: string | null
    imageId: number | null
    filter: string
  }

  const trpc = getContextClient()
  const toast = getContextToast()

  let data: {
    name: string
    description: string | undefined
    art: Blob | null | undefined
    filter: string
  } = {
    name: playlist.name,
    description: playlist.description ?? undefined,
    art: playlist.imageId === null ? null : undefined,
    filter: playlist.filter,
  }

  $: parsedFilter = tryOr(() => decode(data.filter), undefined)

  const editPlaylistMutation = createEditPlaylistMutation(trpc)
  const handleEditPlaylist = async () => {
    if ($editPlaylistMutation.isLoading) return

    if (!parsedFilter) {
      if (data.filter.length > 0) {
        toast.error('Filter is invalid :(')
      } else {
        toast.error('Filter is required')
      }
      return
    }

    $editPlaylistMutation.mutate(
      {
        id: playlist.id,
        data: {
          name: data.name || 'Untitled Playlist',
          description: data.description || null,
          filter: data.filter,
        },
        art: await ifNotNullOrUndefined(data.art, blobToBase64),
      },
      {
        onSuccess: (data) => {
          toast.success(`Updated ${data.name}!`)
          close()
        },
      }
    )
  }
</script>

<form on:submit|preventDefault={handleEditPlaylist}>
  <Dialog title="Edit auto playlist" on:close={close}>
    <AutoPlaylistDetailsForm bind:data />

    <svelte:fragment slot="buttons">
      <Button
        type="submit"
        loading={$editPlaylistMutation.isLoading}
        disabled={!parsedFilter}
        tooltip={!parsedFilter
          ? data.filter.length > 0
            ? 'Disabled: Invalid filter'
            : 'Disabled: Filter is required'
          : undefined}
      >
        Save
      </Button>
      <Button kind="outline" on:click={close}>Cancel</Button>
    </svelte:fragment>
  </Dialog>
</form>
