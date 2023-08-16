<script lang="ts">
  import { makeImageUrl } from 'mutils'

  import CommaList from '$lib/atoms/CommaList.svelte'
  import FlowGrid from '$lib/atoms/FlowGrid.svelte'
  import CoverArt from '$lib/components/CoverArt.svelte'
  import FullscreenLoader from '$lib/components/FullscreenLoader.svelte'
  import { createAllReleasesWithArtistsQuery } from '$lib/services/releases'
  import { getContextClient } from '$lib/trpc'

  const trpc = getContextClient()
  const releasesQuery = createAllReleasesWithArtistsQuery(trpc)
</script>

{#if $releasesQuery.data}
  <FlowGrid>
    {#each $releasesQuery.data as release (release.id)}
      <div class="w-full">
        <a href="/releases/{release.id}" class="w-full">
          <CoverArt
            src={release.imageId !== null
              ? makeImageUrl(release.imageId, { size: 512 })
              : undefined}
          />
        </a>
        <a
          href="/releases/{release.id}"
          class="mt-1 block truncate font-medium hover:underline"
          title={release.title}
        >
          {release.title}
        </a>
        <div class="truncate text-sm text-gray-400">
          <CommaList items={release.artists} let:item>
            <a class="hover:underline" href="/artists/{item.id}">{item.name}</a>
          </CommaList>
        </div>
      </div>
    {/each}
  </FlowGrid>
{:else if $releasesQuery.error}
  <div>{$releasesQuery.error.message}</div>
{:else}
  <FullscreenLoader />
{/if}
