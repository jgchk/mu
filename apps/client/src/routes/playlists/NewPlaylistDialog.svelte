<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  import Button from '$lib/atoms/Button.svelte'
  import Dialog from '$lib/atoms/Dialog.svelte'
  import Input from '$lib/atoms/Input.svelte'
  import InputGroup from '$lib/atoms/InputGroup.svelte'
  import Label from '$lib/atoms/Label.svelte'
  import { createNewPlaylistMutation } from '$lib/services/playlists'
  import { getContextToast } from '$lib/toast/toast'
  import { getContextClient } from '$lib/trpc'

  const dispatch = createEventDispatcher<{ close: undefined }>()
  const close = () => dispatch('close')

  export let name = ''
  export let tracks: number[] | undefined = undefined

  const trpc = getContextClient()
  const newPlaylistMutation = createNewPlaylistMutation(trpc)

  const toast = getContextToast()

  const handleSubmit = () => {
    $newPlaylistMutation.mutate(
      { name: name || 'Untitled Playlist', tracks },
      {
        onSuccess: (data) => {
          toast.success(`Created ${data.name}!`)
          close()
        },
      }
    )
  }
</script>

<form on:submit|preventDefault={handleSubmit}>
  <Dialog title="New Playlist" on:close={close}>
    <InputGroup>
      <Label for="playlist-name">Name</Label>
      <Input id="playlist-name" bind:value={name} autofocus />
    </InputGroup>

    <svelte:fragment slot="buttons">
      <Button type="submit" loading={$newPlaylistMutation.isLoading}>Save</Button>
      <Button kind="outline" on:click={close}>Cancel</Button>
    </svelte:fragment>
  </Dialog>
</form>
