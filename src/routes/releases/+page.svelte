<script lang="ts">
  import { getContextClient } from '$lib/trpc'

  const trpc = getContextClient()
  const releasesQuery = trpc.releases.getAll.query()
</script>

{#if $releasesQuery.data}
  <div class="flex flex-wrap gap-4">
    {#each $releasesQuery.data as release (release.id)}
      <a href="/releases/{release.id}" class="w-[200px]">
        <div class="relative h-[200px] w-full shadow">
          {#if release.hasCoverArt}
            <img
              class="h-full w-full rounded object-cover"
              src="/api/releases/{release.id}/cover-art"
              alt={release.title}
            />
          {:else}
            <div class="center h-full w-full rounded bg-gray-800 italic text-gray-600">
              No cover art
            </div>
          {/if}
          <div
            class="center group absolute top-0 left-0 h-full w-full rounded border border-white border-opacity-20 transition hover:border-primary-500 hover:border-opacity-100 hover:bg-gray-900 hover:bg-opacity-60 active:bg-opacity-80"
          />
        </div>
        <div class="truncate text-sm font-bold" title={release.title}>{release.title}</div>
      </a>
    {/each}
  </div>
{:else if $releasesQuery.error}
  <div>{$releasesQuery.error.message}</div>
{:else}
  <div>Loading...</div>
{/if}
