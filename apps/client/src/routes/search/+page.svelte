<script lang="ts">
  import { onDestroy } from 'svelte';
  import { derived } from 'svelte/store';

  import { getContextClient } from '$lib/trpc';

  import type { PageData } from './$types';
  import SoulseekResults from './SoulseekResults.svelte';
  import SoundcloudSearchResult from './SoundcloudSearchResult.svelte';
  import SpotifySearchResult from './SpotifySearchResult.svelte';
  import type { FileSearchResponse } from './types';

  export let data: PageData;
  let oldQuery = data.query;

  const trpc = getContextClient();
  $: soundcloudQuery = trpc.search.soundcloud.query(
    { query: data.query },
    { enabled: data.hasQuery, staleTime: 60 * 1000 }
  );
  $: spotifyQuery = trpc.search.spotify.query(
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
  <h2>Spotify</h2>
  {#if $spotifyQuery.data}
    <h3>Albums</h3>
    <div class="flex flex-wrap gap-4">
      {#each $spotifyQuery.data.albums as album (album.id)}
        <SpotifySearchResult result={album} />
      {/each}
    </div>

    <h3>Tracks</h3>
    <div class="flex flex-wrap gap-4">
      {#each $spotifyQuery.data.tracks as track (track.id)}
        <SpotifySearchResult result={track} />
      {/each}
    </div>
  {:else if $spotifyQuery.error}
    <div>{$spotifyQuery.error.message}</div>
  {:else}
    <div>Loading...</div>
  {/if}

  <h2>Soundcloud</h2>
  {#if $soundcloudQuery.data}
    <h3>Albums</h3>
    <div class="flex flex-wrap gap-4">
      {#each $soundcloudQuery.data.albums as album (album.id)}
        <SoundcloudSearchResult result={album} />
      {/each}
    </div>

    <h3>Tracks</h3>
    <div class="flex flex-wrap gap-4">
      {#each $soundcloudQuery.data.tracks as track (track.id)}
        <SoundcloudSearchResult result={track} />
      {/each}
    </div>
  {:else if $soundcloudQuery.error}
    <div>{$soundcloudQuery.error.message}</div>
  {:else}
    <div>Loading...</div>
  {/if}

  <h2>Soulseek</h2>
  <SoulseekResults data={soulseekData} />
{:else}
  <div>Enter a search query</div>
{/if}
