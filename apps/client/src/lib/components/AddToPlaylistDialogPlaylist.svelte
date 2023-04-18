<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  import Button from '$lib/atoms/Button.svelte'
  import { createAddTrackToPlaylistMutation } from '$lib/services/playlists'
  import type { RouterOutput } from '$lib/trpc'
  import { getContextClient } from '$lib/trpc'

  export let trackId: number
  export let playlist: RouterOutput['playlists']['getAll'][number]

  const trpc = getContextClient()
  const addToPlaylistMutation = createAddTrackToPlaylistMutation(trpc)

  const dispatch = createEventDispatcher<{ added: undefined }>()

  const handleAddToPlaylist = async () => {
    if ($addToPlaylistMutation.isLoading) return
    await $addToPlaylistMutation.mutateAsync({ playlistId: playlist.id, trackId })
    dispatch('added')
  }
</script>

<Button
  kind="text"
  class="w-full rounded-none text-white !ring-0"
  on:click={handleAddToPlaylist}
  loading={$addToPlaylistMutation.isLoading}
>
  {playlist.name}
</Button>
