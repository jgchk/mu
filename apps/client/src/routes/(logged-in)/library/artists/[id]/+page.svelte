<script lang="ts">
  import { makeCollageUrl, makeImageUrl } from 'mutils'
  import { inview } from 'svelte-inview'

  import Button from '$lib/atoms/Button.svelte'
  import FlowGrid from '$lib/atoms/FlowGrid.svelte'
  import CoverArt from '$lib/components/CoverArt.svelte'
  import FullscreenLoader from '$lib/components/FullscreenLoader.svelte'
  import TrackList from '$lib/components/TrackList.svelte'
  import { getContextDialogs } from '$lib/dialogs/dialogs'
  import { player } from '$lib/now-playing'
  import { createArtistQuery } from '$lib/services/artists'
  import type { RouterOutput } from '$lib/trpc'
  import { getContextClient } from '$lib/trpc'

  import Header from '../../Header.svelte'
  import type { PageData } from './$types'

  export let data: PageData

  const trpc = getContextClient()
  $: artistQuery = createArtistQuery(trpc, data.id)
  $: releasesQuery = trpc.releases.getByArtistId.query({ artistId: data.id })
  $: tracksQuery = trpc.tracks.getAll.infiniteQuery(data.tracksQuery)
  $: tracks = $tracksQuery.data?.pages.flatMap((page) => page.items)

  let inView = false
  $: {
    if (inView && $tracksQuery.hasNextPage && !$tracksQuery.isFetchingNextPage) {
      void $tracksQuery.fetchNextPage()
    }
  }

  const makeQueueData = (
    tracks: RouterOutput['tracks']['getAll']['items'],
    trackIndex: number
  ) => ({
    previousTracks: tracks.slice(0, trackIndex).map((t) => t.id),
    nextTracks: tracks.slice(trackIndex + 1).map((t) => t.id),
  })

  const dialogs = getContextDialogs()
</script>

{#if $artistQuery.data}
  {@const artist = $artistQuery.data}

  <Header
    title={artist.name}
    coverArtSrc={artist.imageId !== null
      ? makeImageUrl(artist.imageId, { size: 512 })
      : makeCollageUrl(artist.imageIds, { size: 512 })}
    coverArtClickable={!!tracks?.length}
    on:clickCoverArt={() =>
      tracks?.length && player.playTrack(tracks[0].id, makeQueueData(tracks, 0))}
  >
    <svelte:fragment slot="subtitle">
      {#if artist.description}
        <p
          class="line-clamp-5 whitespace-pre-wrap leading-[1.19] text-gray-400"
          title={artist.description}
        >
          {artist.description}
        </p>
      {/if}
    </svelte:fragment>

    <Button kind="outline" on:click={() => dialogs.open('edit-artist', { artist })} slot="buttons">
      Edit
    </Button>
  </Header>

  <h2 class="mb-4 mt-8 text-2xl font-bold">Releases</h2>
  {#if $releasesQuery.data}
    {@const releases = $releasesQuery.data}
    <FlowGrid>
      {#each releases as release (release.id)}
        <div class="w-full">
          <a href="/library/releases/{release.id}" class="w-full">
            <CoverArt
              src={release.imageId !== null
                ? makeImageUrl(release.imageId, { size: 512 })
                : undefined}
            />
          </a>
          <a
            href="/library/releases/{release.id}"
            class="mt-1 block truncate font-medium hover:underline"
            title={release.title}
          >
            {release.title}
          </a>
        </div>
      {/each}
    </FlowGrid>
  {:else if $releasesQuery.error}
    <p>Something went wrong</p>
  {:else}
    <FullscreenLoader />
  {/if}

  <h2 class="mb-4 mt-12 text-2xl font-bold">Tracks</h2>
  {#if tracks}
    <TrackList
      {tracks}
      favorites={data.tracksQuery.favorite ?? false}
      sortable
      on:play={(e) =>
        tracks?.length && player.playTrack(e.detail.track.id, makeQueueData(tracks, e.detail.i))}
    >
      <svelte:fragment slot="footer">
        {#if $tracksQuery.hasNextPage}
          <div
            class="m-1 flex justify-center"
            use:inview
            on:inview_change={(event) => (inView = event.detail.inView)}
          >
            <Button kind="outline" on:click={() => $tracksQuery.fetchNextPage()}>
              {$tracksQuery.isFetchingNextPage ? 'Loading...' : 'Load More'}
            </Button>
          </div>
        {/if}
      </svelte:fragment>
    </TrackList>
  {:else if $tracksQuery.error}
    <p>Something went wrong</p>
  {:else}
    <FullscreenLoader />
  {/if}
{:else if $artistQuery.error}
  <p>Something went wrong</p>
{:else}
  <FullscreenLoader />
{/if}
