<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { ifNotNullOrUndefined } from 'utils'
  import { blobToBase64 } from 'utils/browser'

  import Button from '$lib/atoms/Button.svelte'
  import Dialog from '$lib/atoms/Dialog.svelte'
  import { createNewPlaylistMutation } from '$lib/services/playlists'
  import { getContextToast } from '$lib/toast/toast'
  import { getContextClient } from '$lib/trpc'

  import AutoPlaylistDetailsForm from './AutoPlaylistDetailsForm.svelte'
  import LinkToast from './LinkToast.svelte'

  const dispatch = createEventDispatcher<{ close: undefined }>()
  const close = () => dispatch('close')

  export let name = ''
  export let filter = ''

  let data: {
    name: string
    description: string | undefined
    art: Blob | null | undefined
    filter: string
  } = {
    name,
    description: undefined,
    art: null,
    filter,
  }

  const trpc = getContextClient()
  const newPlaylistMutation = createNewPlaylistMutation(trpc)

  const toast = getContextToast()

  const handleSubmit = async () => {
    $newPlaylistMutation.mutate(
      {
        name: data.name || 'Untitled Playlist',
        description: data.description || null,
        art: await ifNotNullOrUndefined(data.art, blobToBase64),
        filter: data.filter,
      },
      {
        onSuccess: (data) => {
          toast.success(LinkToast, {
            props: {
              message: ['Created ', { href: `/playlists/${data.id}`, text: data.name }, '!'],
            },
          })
          close()
        },
      }
    )
  }
</script>

<form on:submit|preventDefault={handleSubmit}>
  <Dialog title="New auto playlist" on:close={close}>
    <AutoPlaylistDetailsForm bind:data />

    <svelte:fragment slot="buttons">
      <Button type="submit" loading={$newPlaylistMutation.isLoading}>Save</Button>
      <Button kind="outline" on:click={close}>Cancel</Button>
    </svelte:fragment>
  </Dialog>
</form>
