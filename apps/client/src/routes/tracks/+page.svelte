<script lang="ts">
  import { getContextClient } from '$lib/trpc'

  import ListView from './ListView.svelte'

  const trpc = getContextClient()
  const tracksQuery = trpc.tracks.getAllWithArtistsAndRelease.query()
</script>

{#if $tracksQuery.data}
  <ListView tracks={$tracksQuery.data} />
{:else if $tracksQuery.error}
  <div>{$tracksQuery.error.message}</div>
{:else}
  <div>Loading...</div>
{/if}
