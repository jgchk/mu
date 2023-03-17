<script lang="ts">
  import { getContextClient } from '$lib/trpc';
  import { onDestroy } from 'svelte';
  import { derived } from 'svelte/store';
  import type { PageData } from './$types';
  import SearchResult from './SearchResult.svelte';
  import SoulseekResults, { type FileSearchResponse } from './SoulseekResults.svelte';

  export let data: PageData;
  let oldQuery = data.query;

  const trpc = getContextClient();
  $: soundcloudQuery = trpc.search.soundcloud.query(
    { query: data.query },
    { enabled: data.hasQuery, staleTime: 60 * 1000 }
  );

  let soulseekData: FileSearchResponse[] = [];
  $: soulseekSubscription = trpc.search.soulseekSubscription.subscription({ query: data.query });
  onDestroy(() => {
    soulseekSubscription.unsubscribe();
  });

  $: {
    if (oldQuery !== data.query) {
      console.log('Query updated');
      soulseekData = [];
      soulseekSubscription.unsubscribe();
      soulseekSubscription = trpc.search.soulseekSubscription.subscription({ query: data.query });
      oldQuery = data.query;
    }
  }

  let cleanup: () => void | undefined;
  $: {
    cleanup?.();
    const { data } = soulseekSubscription;
    cleanup = derived(data, (value) => value).subscribe((v) => {
      if (v) {
        soulseekData = [...soulseekData, v];
      }
    });
  }
  onDestroy(() => {
    cleanup?.();
  });
</script>

{#if data.hasQuery}
  <h2>Soundcloud</h2>
  {#if $soundcloudQuery.data}
    <h3>Albums</h3>
    <div class="flex flex-wrap gap-4">
      {#each $soundcloudQuery.data.albums as album (album.id)}
        <SearchResult result={album} />
      {/each}
    </div>

    <h3>Tracks</h3>
    <div class="flex flex-wrap gap-4">
      {#each $soundcloudQuery.data.tracks as track (track.id)}
        <SearchResult result={track} />
      {/each}
    </div>
  {:else if $soundcloudQuery.error}
    <div>{$soundcloudQuery.error.message}</div>
  {:else}
    <div>Loading...</div>
  {/if}

  <h2>Soulseek</h2>
  <!-- {#if $soulseekQuery.data}
    <SoulseekResults data={$soulseekQuery.data} />
  {:else if $soulseekQuery.error}
    <div>{$soulseekQuery.error.message}</div>
  {:else}
    <div>Loading...</div>
  {/if} -->
  <SoulseekResults data={soulseekData} />
{:else}
  <div>Enter a search query</div>
{/if}
