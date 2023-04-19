<script lang="ts">
  import CoverArt from '$lib/components/CoverArt.svelte'
  import FlowGrid from '$lib/components/FlowGrid.svelte'
  import { makeImageUrl } from '$lib/cover-art'
  import { createFullArtistQuery } from '$lib/services/artists'
  import { getContextClient } from '$lib/trpc'

  import type { PageData } from './$types'

  export let data: PageData

  const trpc = getContextClient()
  const artistQuery = createFullArtistQuery(trpc, data.id)
</script>

{#if $artistQuery.data}
  <div class="p-4 pt-0">
    <h2 class="mb-4 mt-4 text-2xl font-bold">Releases</h2>
    <FlowGrid>
      {#each $artistQuery.data.releases as release (release.id)}
        <div class="w-full">
          <a href="/releases/{release.id}" class="w-full">
            <CoverArt src={release.imageId !== null ? makeImageUrl(release.imageId, {size: 512}) : undefined} />
          </a>
          <a
            href="/releases/{release.id}"
            class="mt-1 block truncate font-medium hover:underline"
            title={release.title}
          >
            {release.title}
          </a>
        </div>
      {/each}
    </FlowGrid>

    <h2 class="mb-4 mt-16 text-2xl font-bold">Tracks</h2>
    <FlowGrid>
      {#each $artistQuery.data.tracks as track (track.id)}
        <div class="w-full">
          <a href="/releases/{track.releaseId}" class="w-full">
            <CoverArt
              src={track.imageId !== null ? makeImageUrl(track.imageId, {size: 512}) : undefined}
              alt={track.title}
            />
          </a>
          <a
            href="/releases/{track.releaseId}"
            class="mt-1 block truncate font-medium hover:underline"
            title={track.title}
          >
            {track.title}
          </a>
        </div>
      {/each}
    </FlowGrid>
  </div>
{:else if $artistQuery.error}
  <p>Something went wrong</p>
{:else}
  <p>Loading...</p>
{/if}
