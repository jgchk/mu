<script lang="ts">
  import { getContextClient } from '$lib/trpc'
  import type { PageData } from './$types'
  import SearchResult from './SearchResult.svelte'

  export let data: PageData

  const trpc = getContextClient()
  $: trackQuery = trpc.search.query(
    { query: data.query },
    { enabled: data.hasQuery, staleTime: 60 * 1000 }
  )

  $: hasTracks = $trackQuery.data && $trackQuery.data.tracks.length > 0
  $: hasAlbums = $trackQuery.data && $trackQuery.data.albums.length > 0
  $: hasSlsk = $trackQuery.data && $trackQuery.data.slsk.length > 0
  $: hasResults = hasTracks || hasAlbums || hasSlsk

  const downloadSlskMutation = trpc.downloads.downloadSlsk.mutation()
</script>

{#if data.hasQuery}
  {#if $trackQuery.data}
    {#if hasResults}
      {#if hasAlbums}
        <h2>Albums</h2>
        <div class="flex flex-wrap gap-4">
          {#each $trackQuery.data.albums as album (album.id)}
            <SearchResult result={album} />
          {/each}
        </div>
      {/if}

      {#if hasTracks}
        <h2>Tracks</h2>
        <div class="flex flex-wrap gap-4">
          {#each $trackQuery.data.tracks as track (track.id)}
            <SearchResult result={track} />
          {/each}
        </div>
      {/if}

      {#if hasSlsk}
        <h2>Soulseek</h2>
        <div>
          {#each $trackQuery.data.slsk.filter((s) => s.slots) as slsk (slsk.file)}
            <button class="block text-left" on:click={() => $downloadSlskMutation.mutate(slsk)}>
              <pre>{JSON.stringify(slsk, null, 2)}</pre>
            </button>
          {/each}
        </div>
      {/if}
    {:else}
      <div>No results</div>
    {/if}
  {:else if $trackQuery.error}
    <div>{$trackQuery.error.message}</div>
  {:else}
    <div>Loading...</div>
  {/if}
{:else}
  <div>Enter a search query</div>
{/if}
