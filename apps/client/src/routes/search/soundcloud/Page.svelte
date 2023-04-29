<script lang="ts">
  import FlowGrid from '$lib/atoms/FlowGrid.svelte'
  import FullscreenLoader from '$lib/components/FullscreenLoader.svelte'
  import { createSearchSoundcloudQuery } from '$lib/services/search'
  import { getContextClient } from '$lib/trpc'

  import type { PageData } from './$types'
  import SoundcloudSearchResult from './SoundcloudSearchResult.svelte'

  export let data: PageData

  const trpc = getContextClient()
  $: soundcloudQuery = createSearchSoundcloudQuery(trpc, data.query)
</script>

{#if data.hasQuery}
  {#if $soundcloudQuery.data}
    <div class="p-4 pt-0">
      <h2 class="mb-4 mt-4 text-2xl font-bold">Albums</h2>
      <FlowGrid>
        {#each $soundcloudQuery.data.albums as album (album.id)}
          <SoundcloudSearchResult result={album} />
        {/each}
      </FlowGrid>

      <h2 class="mb-4 mt-16 text-2xl font-bold">Tracks</h2>
      <FlowGrid>
        {#each $soundcloudQuery.data.tracks as track (track.id)}
          <SoundcloudSearchResult result={track} />
        {/each}
      </FlowGrid>
    </div>
  {:else if $soundcloudQuery.error}
    <div>{$soundcloudQuery.error.message}</div>
  {:else}
    <FullscreenLoader />
  {/if}
{:else}
  <div>Enter a search query</div>
{/if}
