<script lang="ts">
  import { getContextClient } from '$lib/trpc'
  import type { PageData } from './$types'
  import SearchResult from './SearchResult.svelte'
  import SoulseekResults from './SoulseekResults.svelte'

  export let data: PageData

  const trpc = getContextClient()
  $: soundcloudQuery = trpc.search.soundcloud.query(
    { query: data.query },
    { enabled: data.hasQuery, staleTime: 60 * 1000 }
  )
  $: soulseekQuery = trpc.search.soulseek.query(
    { query: data.query },
    { enabled: data.hasQuery, refetchInterval: 100 * 1000 }
  )
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
  {#if $soulseekQuery.data}
    <SoulseekResults data={$soulseekQuery.data} />
  {:else if $soulseekQuery.error}
    <div>{$soulseekQuery.error.message}</div>
  {:else}
    <div>Loading...</div>
  {/if}
{:else}
  <div>Enter a search query</div>
{/if}
