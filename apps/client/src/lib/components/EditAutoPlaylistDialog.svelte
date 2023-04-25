<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { ifNotNullOrUndefined } from 'utils'
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

  const editPlaylistMutation = createEditPlaylistMutation(trpc)
  const handleEditPlaylist = async () => {
    if ($editPlaylistMutation.isLoading) return

    $editPlaylistMutation.mutate(
      {
        id: playlist.id,
        data: { name: data.name || 'Untitled Playlist', description: data.description || null },
        art: await ifNotNullOrUndefined(data.art, blobToBase64),
        filter: data.filter,
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
  <Dialog title="New auto playlist" on:close={close}>
    <AutoPlaylistDetailsForm {data} />

    <svelte:fragment slot="buttons">
      <Button type="submit" loading={$editPlaylistMutation.isLoading}>Save</Button>
      <Button kind="outline" on:click={close}>Cancel</Button>
    </svelte:fragment>
  </Dialog>
</form>
