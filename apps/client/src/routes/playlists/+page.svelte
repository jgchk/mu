<script lang="ts">
  import Button from '$lib/atoms/Button.svelte'
  import { playTrack } from '$lib/now-playing'
  import { createPlaylistsQuery, fetchPlaylistQuery } from '$lib/services/playlists'
  import { getContextClient } from '$lib/trpc'

  import NewPlaylistDialog from './NewPlaylistDialog.svelte'

  const trpc = getContextClient()
  const playlistsQuery = createPlaylistsQuery(trpc)

  let showNewPlaylistDialog = false

  const playPlaylist = async (id: number) => {
    const playlist = await fetchPlaylistQuery(trpc, id)
    playTrack(playlist.tracks[0].trackId, {
      previousTracks: [],
      nextTracks: playlist.tracks.slice(1).map((t) => t.trackId),
    })
  }
</script>

<div class="h-full gap-2 overflow-auto p-1">
  <Button on:click={() => (showNewPlaylistDialog = true)}>New Playlist</Button>

  {#if $playlistsQuery.data}
    {@const playlists = $playlistsQuery.data}
    <div class="p-4">
      {#each playlists as playlist (playlist.id)}
        <div
          class="group flex select-none items-center gap-2 rounded p-1.5 hover:bg-gray-700"
          on:dblclick={() => playPlaylist(playlist.id)}
        >
          <div class="flex-1 truncate">
            <a href="/playlists/{playlist.id}" class="hover:underline">
              {playlist.name}
            </a>
          </div>
        </div>
      {/each}
    </div>
  {:else if $playlistsQuery.error}
    <div>{$playlistsQuery.error.message}</div>
  {:else}
    <div>Loading...</div>
  {/if}
</div>

{#if showNewPlaylistDialog}
  <NewPlaylistDialog on:close={() => (showNewPlaylistDialog = false)} />
{/if}
