<script lang="ts">
  import { getContextClient } from '$lib/trpc'

  const trpc = getContextClient()
  const downloadsQuery = trpc.downloads.getAll.query()
</script>

{#if $downloadsQuery.data}
  {#if $downloadsQuery.data.length > 0}
    <ul>
      {#each $downloadsQuery.data as download (download.id)}
        <li>{download.ref} ({download.complete ? 'complete' : 'downloading'})</li>
      {/each}
    </ul>
  {:else}
    <div>No downloads</div>
  {/if}
{:else if $downloadsQuery.error}
  <div>{$downloadsQuery.error.message}</div>
{:else}
  <div>Loading...</div>
{/if}
