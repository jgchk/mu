<script lang="ts">
  import { makeCollageUrl, makeImageUrl } from 'mutils'

  import Button from '$lib/atoms/Button.svelte'
  import FlowGrid from '$lib/atoms/FlowGrid.svelte'
  import CoverArt from '$lib/components/CoverArt.svelte'
  import FullscreenLoader from '$lib/components/FullscreenLoader.svelte'
  import { getContextDialogs } from '$lib/dialogs/dialogs'
  import { getContextClient } from '$lib/trpc'

  export let name: string | undefined = undefined

  const trpc = getContextClient()
  const playlistsQuery = trpc.playlists.getAll.query({ name })

  const dialogs = getContextDialogs()
</script>

<div class="flex h-full flex-col gap-2 space-y-2 overflow-auto">
  <div class="flex gap-1">
    <Button on:click={() => dialogs.open('new-playlist')}>New Playlist</Button>
    <Button kind="outline" on:click={() => dialogs.open('new-auto-playlist')}>
      New Auto-Playlist
    </Button>
  </div>

  {#if $playlistsQuery.data}
    {@const playlists = $playlistsQuery.data}

    <FlowGrid>
      {#each playlists as playlist (playlist.id)}
        <div class="w-full">
          <a href="/library/playlists/{playlist.id}" class="relative block w-full">
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
            href="/library/playlists/{playlist.id}"
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
    <FullscreenLoader class="flex-1" />
  {/if}
</div>
