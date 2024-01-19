<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import { createEventDispatcher } from 'svelte'

  import Button from '$lib/atoms/Button.svelte'
  import Dialog from '$lib/atoms/Dialog.svelte'
  import { getContextToast } from '$lib/toast/toast'
  import { getContextClient } from '$lib/trpc'

  export let artist: {
    id: number
    name: string | null
  }

  const trpc = getContextClient()
  const toast = getContextToast()

  const deleteArtistMutation = trpc.artists.delete.mutation()
  const handleDeleteArtist = () => {
    if ($deleteArtistMutation.isLoading) return

    $deleteArtistMutation.mutate(
      { id: artist.id },
      {
        onSuccess: () => {
          toast.success(`Deleted ${artist.name || 'artist'}`)
          if ($page.url.pathname === `/library/artists/${artist.id}`) {
            void goto('/library/artists')
          }
          close()
        },
      }
    )
  }

  const dispatch = createEventDispatcher<{ close: undefined; add: undefined }>()
  const close = () => dispatch('close')
</script>

<Dialog title="Delete artist" class="max-w-lg" on:close={close}>
  Are you sure you want to delete {#if artist.name}<span class="font-semibold">{artist.name}</span
    >{:else}this artist{/if}?

  <svelte:fragment slot="buttons">
    <Button type="submit" on:click={handleDeleteArtist} loading={$deleteArtistMutation.isLoading}>
      Delete
    </Button>
    <Button kind="outline" on:click={close}>Cancel</Button>
  </svelte:fragment>
</Dialog>
