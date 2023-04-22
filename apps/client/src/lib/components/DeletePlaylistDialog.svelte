<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import Button from '$lib/atoms/Button.svelte'
  import Dialog from '$lib/atoms/Dialog.svelte'
  import { createDeletePlaylistMutation } from '$lib/services/playlists'
  import { getContextToast } from '$lib/toast/toast'
  import { getContextClient } from '$lib/trpc'

  export let playlist: {
    id: number
    name: string
  }

  const trpc = getContextClient()
  const toast = getContextToast()

  const deletePlaylistMutation = createDeletePlaylistMutation(trpc)
  const handleDeletePlaylist = () => {
    if ($deletePlaylistMutation.isLoading) return

    $deletePlaylistMutation.mutate(
      { id: playlist.id },
      {
        onSuccess: () => {
          toast.success(`Deleted ${playlist.name}`)
          if ($page.url.pathname === `/playlists/${playlist.id}`) {
            void goto('/playlists')
          }
          close()
        },
      }
    )
  }

  const dispatch = createEventDispatcher<{ close: undefined; add: undefined }>()
  const close = () => dispatch('close')
</script>

<Dialog title="Delete playlist" class="max-w-lg" on:close={close}>
  Are you sure you want to delete <span class="font-semibold">{playlist.name}</span>?

  <svelte:fragment slot="buttons">
    <Button
      type="submit"
      on:click={handleDeletePlaylist}
      loading={$deletePlaylistMutation.isLoading}
    >
      Delete
    </Button>
    <Button kind="outline" on:click={close}>Cancel</Button>
  </svelte:fragment>
</Dialog>
