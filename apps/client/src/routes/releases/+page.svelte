<script lang="ts">
  import CoverArt from '$lib/components/CoverArt.svelte'
  import FlowGrid from '$lib/components/FlowGrid.svelte'
  import { makeReleaseCoverArtUrl } from '$lib/cover-art'
  import { getContextClient } from '$lib/trpc'

  const trpc = getContextClient()
  const releasesQuery = trpc.releases.getAll.query()
</script>

{#if $releasesQuery.data}
  <FlowGrid class="p-4">
    {#each $releasesQuery.data as release (release.id)}
      <a href="/releases/{release.id}" class="w-full overflow-hidden">
        <CoverArt
          src={release.coverArtHash
            ? makeReleaseCoverArtUrl(release.id, release.coverArtHash, { size: 400 })
            : undefined}
          alt={release.title}
        />
        <div class="truncate text-sm font-bold" title={release.title}>{release.title}</div>
      </a>
    {/each}
  </FlowGrid>
{:else if $releasesQuery.error}
  <div>{$releasesQuery.error.message}</div>
{:else}
  <div>Loading...</div>
{/if}
