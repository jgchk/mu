<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  import type { PopperTooltipAction } from '$lib/actions/popper'
  import { tooltip } from '$lib/actions/tooltip'
  import Button from '$lib/atoms/Button.svelte'
  import Input from '$lib/atoms/Input.svelte'
  import { getContextDialogs } from '$lib/dialogs/dialogs'
  import { createAddTrackToPlaylistMutation, createPlaylistsQuery } from '$lib/services/playlists'
  import { getContextClient } from '$lib/trpc'
  import { tw } from '$lib/utils/classes'

  export let trackId: number
  export let popperTooltip: PopperTooltipAction
  let class_: string | undefined = undefined
  export { class_ as class }

  const trpc = getContextClient()
  const playlistsQuery = createPlaylistsQuery(trpc)
  const addToPlaylistMutation = createAddTrackToPlaylistMutation(trpc)

  const dialogs = getContextDialogs()

  const handleNewPlaylist = () => {
    dialogs.open('new-playlist', { name: filter, tracks: [trackId] })
    close()
  }

  let addingToPlaylistId: number | undefined = undefined
  const handleAddToPlaylist = async (playlistId: number) => {
    if ($addToPlaylistMutation.isLoading) return
    addingToPlaylistId = playlistId
    await $addToPlaylistMutation
      .mutateAsync({ playlistId, trackId })
      .then(() => {
        addingToPlaylistId = undefined
      })
      .catch(() => {
        addingToPlaylistId = undefined
      })
    close()
  }

  const dispatch = createEventDispatcher<{ close: undefined }>()
  const close = () => dispatch('close')

  let filter = ''
  $: filteredPlaylists = $playlistsQuery.data?.filter((p) =>
    p.name.toLowerCase().includes(filter.toLowerCase())
  )
</script>

<div
  class={tw('w-full max-w-xs rounded-lg border border-gray-600 bg-gray-700 shadow-lg', class_)}
  use:popperTooltip={{ modifiers: [{ name: 'offset', options: { offset: [0, 32] } }] }}
>
  <div class="m-2 mb-0">
    <Input
      class="w-full"
      layer={700}
      bind:value={filter}
      autofocus
      placeholder="Find a playlist..."
      on:keydown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          if (filteredPlaylists?.length) {
            void handleAddToPlaylist(filteredPlaylists[0].id)
          } else {
            void handleNewPlaylist()
          }
        }
      }}
    />
  </div>

  <div class="max-h-[calc(100vh/3)] overflow-auto p-2" tabindex="-1">
    <Button kind="text" class="w-full text-white" layer={700} on:click={handleNewPlaylist}>
      New Playlist
    </Button>
    {#if filteredPlaylists}
      {#each filteredPlaylists as playlist (playlist.id)}
        <Button
          kind="text"
          class="w-full text-white"
          layer={700}
          on:click={() => handleAddToPlaylist(playlist.id)}
          loading={addingToPlaylistId === playlist.id}
        >
          {playlist.name}
        </Button>
      {/each}
      {#if filteredPlaylists.length === 0 && filter.length === 0}
        <Button kind="text" disabled>Enter a playlist title...</Button>
      {/if}
    {:else if $playlistsQuery.error}
      <Button
        kind="text"
        class="w-full text-white"
        layer={700}
        on:click={() => $playlistsQuery.refetch()}
        loading={$playlistsQuery.isFetching}
      >
        <span class="text-error-500" use:tooltip={{ content: $playlistsQuery.error.message }}
          >Error</span
        > loading playlists. Retry?
      </Button>
    {:else}
      <div class="block w-full p-1 px-2 text-left text-sm text-gray-400">Loading playlists...</div>
    {/if}
  </div>
</div>
