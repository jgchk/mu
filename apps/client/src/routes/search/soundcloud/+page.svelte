<script lang="ts">
  import FlowGrid from '$lib/components/FlowGrid.svelte';
  import { getContextClient } from '$lib/trpc';

  import type { PageData } from './$types';
  import SoundcloudSearchResult from './SoundcloudSearchResult.svelte';

  export let data: PageData;

  const trpc = getContextClient();
  $: soundcloudQuery = trpc.search.soundcloud.query(
    { query: data.query },
    { enabled: data.hasQuery, staleTime: 60 * 1000 }
  );
</script>

{#if data.hasQuery}
  {#if $soundcloudQuery.data}
    <h3>Albums</h3>
    <FlowGrid>
      {#each $soundcloudQuery.data.albums as album (album.id)}
        <SoundcloudSearchResult result={album} />
      {/each}
    </FlowGrid>

    <h3>Tracks</h3>
    <FlowGrid>
      {#each $soundcloudQuery.data.tracks as track (track.id)}
        <SoundcloudSearchResult result={track} />
      {/each}
    </FlowGrid>
  {:else if $soundcloudQuery.error}
    <div>{$soundcloudQuery.error.message}</div>
  {:else}
    <div>Loading...</div>
  {/if}
{:else}
  <div>Enter a search query</div>
{/if}
