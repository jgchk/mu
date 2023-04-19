<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  import Button from '$lib/atoms/Button.svelte'
  import Dialog from '$lib/atoms/Dialog.svelte'
  import { createAddTrackToPlaylistMutation } from '$lib/services/playlists'
  import { getContextToast } from '$lib/toast/toast'
  import { getContextClient } from '$lib/trpc'

  export let playlistId: number
  export let trackId: number

  const trpc = getContextClient()
  const toast = getContextToast()

  const addToPlaylistMutation = createAddTrackToPlaylistMutation(trpc)
  const handleAddToPlaylist = () => {
    if ($addToPlaylistMutation.isLoading) return

    $addToPlaylistMutation.mutate(
      { playlistId, trackId },
      {
        onSuccess: (data) => {
          toast.success(`Added to ${data.playlist.name}!`)
          close()
        },
      }
    )
  }

  const dispatch = createEventDispatcher<{ close: undefined; add: undefined }>()
  const close = () => dispatch('close')
</script>

<Dialog title="Already added" on:close={close}>
  This is already in your playlist.

  <svelte:fragment slot="buttons">
    <Button type="submit" on:click={close}>Don't add</Button>
    <Button
      kind="outline"
      on:click={handleAddToPlaylist}
      loading={$addToPlaylistMutation.isLoading}
    >
      Add anyway
    </Button>
  </svelte:fragment>
</Dialog>
