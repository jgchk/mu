<script lang="ts">
  import { isNotNull } from 'utils'

  import CoverArt from '$lib/components/CoverArt.svelte'
  import FlowGrid from '$lib/components/FlowGrid.svelte'
  import { makeCollageUrl, makeImageUrl } from '$lib/cover-art'
  import { createFullArtistQuery } from '$lib/services/artists'
  import { getContextClient } from '$lib/trpc'

  import type { PageData } from './$types'

  export let data: PageData

  const trpc = getContextClient()
  const artistQuery = createFullArtistQuery(trpc, data.id)
</script>

{#if $artistQuery.data}
  {@const artist = $artistQuery.data}
  {@const imageIds = artist.releases
    .map((r) => r.imageId)
    .concat(artist.tracks.map((t) => t.imageId))
    .filter(isNotNull)}

  <div class="p-4">
    <div class="relative flex items-end gap-6">
      <div class="relative w-64 shrink-0">
        <CoverArt
          src={artist.imageId !== null
            ? makeImageUrl(artist.imageId, { size: 512 })
            : makeCollageUrl(imageIds, { size: 512 })}
          alt={artist.name}
          hoverable={false}
        />
      </div>

      <div class="space-y-1 pb-2">
        <h1
          class="mr-11 line-clamp-2 break-all text-6xl font-bold leading-[1.19]"
          title={artist.name}
        >
          {artist.name}
        </h1>
      </div>
    </div>

    <h2 class="mb-4 mt-8 text-2xl font-bold">Releases</h2>
    <FlowGrid>
      {#each artist.releases as release (release.id)}
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
        </div>
      {/each}
    </FlowGrid>

    <h2 class="mb-4 mt-12 text-2xl font-bold">Tracks</h2>
    <FlowGrid>
      {#each artist.tracks as track (track.id)}
        <div class="w-full">
          <a href="/releases/{track.releaseId}" class="w-full">
            <CoverArt
              src={track.imageId !== null ? makeImageUrl(track.imageId, { size: 512 }) : undefined}
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
