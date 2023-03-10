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
</script>

{#if data.hasQuery}
  {#if $trackQuery.data}
    {#if $trackQuery.data.length > 0}
      <div class="flex flex-wrap gap-4">
        {#each $trackQuery.data as track (track.id)}
          <SearchResult result={track} />
        {/each}
      </div>
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
