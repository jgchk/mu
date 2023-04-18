<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  import { tooltip } from '$lib/actions/tooltip'
  import Button from '$lib/atoms/Button.svelte'
  import Dialog from '$lib/atoms/Dialog.svelte'
  import Input from '$lib/atoms/Input.svelte'
  import { createNewPlaylistMutation, createPlaylistsQuery } from '$lib/services/playlists'
  import { getContextClient } from '$lib/trpc'

  import AddToPlaylistDialogPlaylist from './AddToPlaylistDialogPlaylist.svelte'

  export let trackId: number

  const trpc = getContextClient()
  const playlistsQuery = createPlaylistsQuery(trpc)
  const newPlaylistMutation = createNewPlaylistMutation(trpc)

  const handleNewPlaylist = async () => {
    if ($newPlaylistMutation.isLoading) return
    await $newPlaylistMutation.mutateAsync({ name: filter, tracks: [trackId] })
    close()
  }

  const dispatch = createEventDispatcher<{ close: undefined }>()
  const close = () => dispatch('close')

  let filter = ''
  $: filteredPlaylists = $playlistsQuery.data?.filter((p) =>
    p.name.toLowerCase().includes(filter.toLowerCase())
  )
</script>

<Dialog title="Add to Playlist" on:close={close} class="max-w-xs">
  <Input
    class="w-full"
    bind:value={filter}
    autofocus
    on:keydown={(e) => {
      if (e.key === 'Enter') {
        void handleNewPlaylist()
      }
    }}
  />

  <div class="max-h-xs mt-1 overflow-auto rounded border border-gray-700">
    {#if filteredPlaylists}
      {#each filteredPlaylists as playlist (playlist.id)}
        <AddToPlaylistDialogPlaylist {playlist} {trackId} on:added={close} />
      {/each}
    {:else if $playlistsQuery.error}
      <Button
        kind="text"
        class="w-full rounded-none text-white !ring-0"
        on:click={() => $playlistsQuery.refetch()}
        loading={$playlistsQuery.isFetching}
      >
        <span class="text-error-500" use:tooltip={{ content: $playlistsQuery.error.message }}
          >Error</span
        > loading playlists. Retry?
      </Button>
    {:else}
      <div class="block w-full rounded p-1 px-2 text-left">Loading playlists...</div>
    {/if}
    {#if filter.length > 0}
      <Button
        kind="text"
        class="w-full rounded-none text-white !ring-0"
        on:click={handleNewPlaylist}
        loading={$newPlaylistMutation.isLoading}
      >
        New Playlist "{filter}"
      </Button>
    {/if}
  </div>

  <svelte:fragment slot="buttons">
    <Button kind="outline" on:click={close}>Cancel</Button>
  </svelte:fragment>
</Dialog>
