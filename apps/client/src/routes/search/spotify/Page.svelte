<script lang="ts">
  import FlowGrid from '$lib/components/FlowGrid.svelte'
  import FullscreenLoader from '$lib/components/FullscreenLoader.svelte'
  import { createSearchSpotifyQuery } from '$lib/services/search'
  import { getContextClient } from '$lib/trpc'

  import type { PageData } from './$types'
  import SpotifySearchResult from './SpotifySearchResult.svelte'

  export let data: PageData

  const trpc = getContextClient()
  $: spotifyQuery = createSearchSpotifyQuery(trpc, data.query)
</script>

{#if data.hasQuery}
  {#if $spotifyQuery.data}
    <div class="p-4 pt-0">
      <h2 class="mb-4 mt-4 text-2xl font-bold">Albums</h2>
      <FlowGrid>
        {#each $spotifyQuery.data.albums as album (album.id)}
          <SpotifySearchResult result={album} />
        {/each}
      </FlowGrid>

      <h2 class="mb-4 mt-16 text-2xl font-bold">Tracks</h2>
      <FlowGrid>
        {#each $spotifyQuery.data.tracks as track (track.id)}
          <SpotifySearchResult result={track} />
        {/each}
      </FlowGrid>
    </div>
  {:else if $spotifyQuery.error}
    <div>{$spotifyQuery.error.message}</div>
  {:else}
    <FullscreenLoader />
  {/if}
{:else}
  <div>Enter a search query</div>
{/if}
