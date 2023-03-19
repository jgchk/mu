<script lang="ts">
  import FlowGrid from '$lib/components/FlowGrid.svelte';
  import { getContextClient } from '$lib/trpc';

  import type { PageData } from './$types';
  import SpotifySearchResult from './SpotifySearchResult.svelte';

  export let data: PageData;

  const trpc = getContextClient();
  $: spotifyQuery = trpc.search.spotify.query(
    { query: data.query },
    { enabled: data.hasQuery, staleTime: 60 * 1000 }
  );
</script>

{#if data.hasQuery}
  {#if $spotifyQuery.data}
    <h3>Albums</h3>
    <FlowGrid>
      {#each $spotifyQuery.data.albums as album (album.id)}
        <SpotifySearchResult result={album} />
      {/each}
    </FlowGrid>

    <h3>Tracks</h3>
    <FlowGrid>
      {#each $spotifyQuery.data.tracks as track (track.id)}
        <SpotifySearchResult result={track} />
      {/each}
    </FlowGrid>
  {:else if $spotifyQuery.error}
    <div>{$spotifyQuery.error.message}</div>
  {:else}
    <div>Loading...</div>
  {/if}
{:else}
  <div>Enter a search query</div>
{/if}
