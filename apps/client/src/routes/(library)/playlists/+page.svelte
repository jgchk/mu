<script lang="ts">
  import Button from '$lib/atoms/Button.svelte'
  import CoverArt from '$lib/components/CoverArt.svelte'
  import FlowGrid from '$lib/components/FlowGrid.svelte'
  import { makeCollageUrl, makeImageUrl } from '$lib/cover-art'
  import { getContextDialogs } from '$lib/dialogs/dialogs'
  import { createPlaylistsQuery } from '$lib/services/playlists'
  import { getContextClient } from '$lib/trpc'

  const trpc = getContextClient()
  const playlistsQuery = createPlaylistsQuery(trpc)

  const dialogs = getContextDialogs()
</script>

<div class="h-full gap-2 overflow-auto p-1">
  <div class="flex gap-1 pl-2">
    <Button on:click={() => dialogs.open('new-playlist')}>New Playlist</Button>
    <Button kind="outline" on:click={() => dialogs.open('new-auto-playlist')}>
      New Auto-Playlist
    </Button>
  </div>

  {#if $playlistsQuery.data}
    {@const playlists = $playlistsQuery.data}

    <FlowGrid class="p-4">
      {#each playlists as playlist (playlist.id)}
        <div class="w-full">
          <a href="/playlists/{playlist.id}" class="relative block w-full">
            <CoverArt
              src={playlist.imageId !== null
                ? makeImageUrl(playlist.imageId, { size: 512 })
                : makeCollageUrl(playlist.imageIds, { size: 512 })}
            >
              <svelte:fragment slot="insert">
                {#if playlist.filter !== null}
                  <div
                    class="bg-secondary-600 border-secondary-700 absolute bottom-0 right-0 ml-auto rounded-br rounded-tl border-l border-t border-opacity-75 bg-opacity-75 pb-[3px] pl-[3px] pr-[6px] pt-[1px] text-xs font-semibold italic text-white"
                  >
                    Auto
                  </div>
                {/if}
              </svelte:fragment>
            </CoverArt>
          </a>
          <a
            href="/playlists/{playlist.id}"
            class="mt-1 block truncate font-medium hover:underline"
            title={playlist.name}
          >
            {playlist.name}
          </a>
        </div>
      {/each}
    </FlowGrid>
  {:else if $playlistsQuery.error}
    <div>{$playlistsQuery.error.message}</div>
  {:else}
    <div>Loading...</div>
  {/if}
</div>
