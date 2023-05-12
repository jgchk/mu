<script lang="ts">
  import FlowGrid from '$lib/atoms/FlowGrid.svelte'
  import CoverArt from '$lib/components/CoverArt.svelte'
  import FullscreenLoader from '$lib/components/FullscreenLoader.svelte'
  import { makeCollageUrl, makeImageUrl } from '$lib/cover-art'
  import { createAllArtistsQuery } from '$lib/services/artists'
  import { getContextClient } from '$lib/trpc'

  const trpc = getContextClient()
  const artistsQuery = createAllArtistsQuery(trpc)
</script>

{#if $artistsQuery.data}
  {@const artists = $artistsQuery.data}

  <FlowGrid>
    {#each artists as artist (artist.id)}
      <div class="w-full">
        <a href="/artists/{artist.id}" class="w-full">
          <CoverArt
            src={artist.imageId !== null
              ? makeImageUrl(artist.imageId, { size: 512 })
              : makeCollageUrl(artist.imageIds, { size: 512 })}
          />
        </a>
        <a
          href="/artists/{artist.id}"
          class="mt-1 block truncate font-medium hover:underline"
          title={artist.name}
        >
          {artist.name}
        </a>
      </div>
    {/each}
  </FlowGrid>
{:else if $artistsQuery.error}
  <div>{$artistsQuery.error.message}</div>
{:else}
  <FullscreenLoader />
{/if}
