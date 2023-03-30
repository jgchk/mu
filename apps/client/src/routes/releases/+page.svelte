<script lang="ts">
  import FlowGrid from '$lib/components/FlowGrid.svelte'
  import { getContextClient } from '$lib/trpc'

  const trpc = getContextClient()
  const releasesQuery = trpc.releases.getAll.query()
</script>

{#if $releasesQuery.data}
  <FlowGrid class="p-4">
    {#each $releasesQuery.data as release (release.id)}
      <a href="/releases/{release.id}" class="w-full overflow-hidden">
        <div class="relative w-full pt-[100%] shadow">
          {#if release.hasCoverArt}
            <img
              class="absolute left-0 top-0 h-full w-full rounded object-cover"
              src="/api/releases/{release.id}/cover-art?width=400&height=400"
              alt={release.title}
            />
          {:else}
            <div
              class="center absolute left-0 top-0 h-full w-full rounded bg-gray-800 italic text-gray-600"
            >
              No cover art
            </div>
          {/if}
          <div
            class="center hover:border-primary-500 group absolute left-0 top-0 h-full w-full rounded border border-white border-opacity-20 transition hover:border-opacity-100 hover:bg-gray-900 hover:bg-opacity-60 active:bg-opacity-80"
          />
        </div>
        <div class="truncate text-sm font-bold" title={release.title}>{release.title}</div>
      </a>
    {/each}
  </FlowGrid>
{:else if $releasesQuery.error}
  <div>{$releasesQuery.error.message}</div>
{:else}
  <div>Loading...</div>
{/if}
