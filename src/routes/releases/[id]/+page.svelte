<script lang="ts">
  import { getContextClient } from '$lib/trpc'
  import type { PageData } from './$types'

  export let data: PageData

  const trpc = getContextClient()
  const releaseQuery = trpc.releases.getById.query({ id: data.id })
  const tracksQuery = trpc.tracks.getByReleaseId.query({ releaseId: data.id })
</script>

{#if $releaseQuery.data && $tracksQuery.data}
  <h1 class="text-lg font-bold">{$releaseQuery.data.title}</h1>
  <ul>
    {#each $tracksQuery.data as track (track.id)}
      <li>{track.title}</li>
    {/each}
  </ul>
{:else if $releaseQuery.error || $tracksQuery.error}
  <div>{($releaseQuery.error ?? $tracksQuery.error)?.message}</div>
{:else}
  <div>Loading...</div>
{/if}
