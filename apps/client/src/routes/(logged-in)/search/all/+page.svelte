<script lang="ts">
  import { makeCollageUrl, makeImageUrl } from 'mutils'

  import CommaList from '$lib/atoms/CommaList.svelte'
  import FlowGrid from '$lib/atoms/FlowGrid.svelte'
  import LinkButton from '$lib/atoms/LinkButton.svelte'
  import CoverArt from '$lib/components/CoverArt.svelte'
  import FullscreenLoader from '$lib/components/FullscreenLoader.svelte'
  import TrackList from '$lib/components/TrackList.svelte'
  import { playTrack } from '$lib/now-playing'
  import { getContextClient } from '$lib/trpc'
  import type { RouterOutput } from '$lib/trpc'

  import { withSearchQuery } from '../common'
  import type { PageData } from './$types'
  import { NUM_TRACKS } from './common'

  export let data: PageData

  const trpc = getContextClient()
  $: tracksQuery = trpc.tracks.getAll.query({ title: data.searchQuery, limit: NUM_TRACKS })
  $: releasesQuery = trpc.releases.getAll.query({ title: data.searchQuery })
  $: artistsQuery = trpc.artists.getAll.query({ name: data.searchQuery })

  const makeQueueData = (
    tracks: RouterOutput['tracks']['getAll']['items'],
    trackIndex: number
  ) => ({
    previousTracks: tracks.slice(0, trackIndex).map((t) => t.id),
    nextTracks: tracks.slice(trackIndex + 1).map((t) => t.id),
  })
</script>

<h2 class="mb-4 mt-2 text-2xl font-bold">Tracks</h2>
{#if $tracksQuery.data}
  {@const tracks = $tracksQuery.data.items}
  <TrackList
    {tracks}
    on:play={(e) => playTrack(e.detail.track.id, makeQueueData(tracks, e.detail.i))}
  />
  {#if $tracksQuery.data.nextCursor !== undefined}
    <LinkButton
      class="mt-2"
      kind="outline"
      href={withSearchQuery('/search/tracks', data.searchQuery)}>See All</LinkButton
    >
  {/if}
{:else if $tracksQuery.error}
  <div>{$tracksQuery.error.message}</div>
{:else}
  <FullscreenLoader />
{/if}

<h2 class="mb-4 mt-12 text-2xl font-bold">Releases</h2>
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

<h2 class="mb-4 mt-12 text-2xl font-bold">Artists</h2>
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
