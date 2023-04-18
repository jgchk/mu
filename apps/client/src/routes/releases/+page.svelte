<script lang="ts">
  import CoverArt from '$lib/components/CoverArt.svelte'
  import FlowGrid from '$lib/components/FlowGrid.svelte'
  import { makeImageUrl } from '$lib/cover-art'
  import { createAllReleasesWithArtistsQuery } from '$lib/services/releases'
  import { getContextClient } from '$lib/trpc'

  const trpc = getContextClient()
  const releasesQuery = createAllReleasesWithArtistsQuery(trpc)
</script>

{#if $releasesQuery.data}
  <FlowGrid class="p-4">
    {#each $releasesQuery.data as release (release.id)}
      <div class="w-full">
        <a href="/releases/{release.id}" class="w-full">
          <CoverArt src={release.imageId !== null ? makeImageUrl(release.imageId) : undefined} />
        </a>
        <a
          href="/releases/{release.id}"
          class="mt-1 block truncate font-medium hover:underline"
          title={release.title}
        >
          {release.title}
        </a>
        <ul class="comma-list text-sm text-gray-400">
          {#each release.artists as artist (artist.id)}
            <li class="flex">
              <a class="hover:underline" href="/artists/{artist.id}">{artist.name}</a>
            </li>
          {/each}
        </ul>
      </div>
    {/each}
  </FlowGrid>
{:else if $releasesQuery.error}
  <div>{$releasesQuery.error.message}</div>
{:else}
  <div>Loading...</div>
{/if}
