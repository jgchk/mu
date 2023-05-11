<script lang="ts">
  import Button from '$lib/atoms/Button.svelte'
  import FlowGrid from '$lib/atoms/FlowGrid.svelte'
  import CoverArt from '$lib/components/CoverArt.svelte'
  import FullscreenLoader from '$lib/components/FullscreenLoader.svelte'
  import TrackList from '$lib/components/TrackList.svelte'
  import { makeCollageUrl, makeImageUrl } from '$lib/cover-art'
  import { getContextDialogs } from '$lib/dialogs/dialogs'
  import { playTrack } from '$lib/now-playing'
  import {
    createArtistQuery,
    createArtistReleasesQuery,
    createArtistTracksQuery,
  } from '$lib/services/artists'
  import { createFavoriteTrackMutation } from '$lib/services/tracks'
  import type { RouterOutput } from '$lib/trpc'
  import { getContextClient } from '$lib/trpc'

  import type { PageData } from './$types'

  export let data: PageData

  const trpc = getContextClient()
  $: artistQuery = createArtistQuery(trpc, data.id)
  $: releasesQuery = createArtistReleasesQuery(trpc, data.id)
  $: tracksQuery = createArtistTracksQuery(trpc, data.tracksQuery)

  $: favoriteMutation = createFavoriteTrackMutation(trpc, {
    getArtistTracksQuery: { id: data.id },
  })

  const makeQueueData = (tracks: RouterOutput['artists']['tracks'], trackIndex: number) => ({
    previousTracks: tracks.slice(0, trackIndex).map((t) => t.id),
    nextTracks: tracks.slice(trackIndex + 1).map((t) => t.id),
  })

  const dialogs = getContextDialogs()
</script>

{#if $artistQuery.data}
  {@const artist = $artistQuery.data}

  <div>
    <div class="relative flex items-end gap-6">
      <div class="relative w-64 shrink-0">
        <CoverArt
          src={artist.imageId !== null
            ? makeImageUrl(artist.imageId, { size: 512 })
            : makeCollageUrl(artist.imageIds, { size: 512 })}
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
        {#if artist.description}
          <p
            class="line-clamp-5 whitespace-pre-wrap leading-[1.19] text-gray-400"
            title={artist.description}
          >
            {artist.description}
          </p>
        {/if}
      </div>

      <Button
        kind="outline"
        class="absolute right-0 top-0"
        on:click={() => dialogs.open('edit-artist', { artist })}
      >
        Edit
      </Button>
    </div>

    <h2 class="mb-4 mt-8 text-2xl font-bold">Releases</h2>
    {#if $releasesQuery.data}
      {@const releases = $releasesQuery.data}
      <FlowGrid>
        {#each releases as release (release.id)}
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
    {:else if $releasesQuery.error}
      <p>Something went wrong</p>
    {:else}
      <FullscreenLoader />
    {/if}

    <h2 class="mb-4 mt-12 text-2xl font-bold">Tracks</h2>
    {#if $tracksQuery.data}
      {@const tracks = $tracksQuery.data}
      <TrackList
        {tracks}
        favorites={data.tracksQuery.favorite ?? false}
        sortable
        on:play={(e) => playTrack(e.detail.track.id, makeQueueData(tracks, e.detail.i))}
        on:favorite={(e) =>
          $favoriteMutation.mutate({ id: e.detail.track.id, favorite: e.detail.favorite })}
      />
    {:else if $tracksQuery.error}
      <p>Something went wrong</p>
    {:else}
      <FullscreenLoader />
    {/if}
  </div>
{:else if $artistQuery.error}
  <p>Something went wrong</p>
{:else}
  <FullscreenLoader />
{/if}
