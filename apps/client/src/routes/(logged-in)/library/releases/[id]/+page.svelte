<script lang="ts">
  import { makeImageUrl } from 'mutils'

  import CommaList from '$lib/atoms/CommaList.svelte'
  import LinkButton from '$lib/atoms/LinkButton.svelte'
  import FullscreenLoader from '$lib/components/FullscreenLoader.svelte'
  import TrackList from '$lib/components/TrackList.svelte'
  import { playTrack } from '$lib/now-playing'
  import type { RouterOutput } from '$lib/trpc'
  import { getContextClient } from '$lib/trpc'

  import Header from '../../Header.svelte'
  import type { PageData } from './$types'
  import Tags from './Tags.svelte'

  export let data: PageData

  const trpc = getContextClient()
  $: releaseQuery = trpc.releases.get.query({ id: data.id })
  $: tracksQuery = trpc.tracks.getByReleaseId.query({
    releaseId: data.id,
    filter: data.tracksQuery,
  })
  $: tracks = $tracksQuery.data

  const makeQueueData = (tracks: RouterOutput['tracks']['getByReleaseId'], trackIndex: number) => ({
    previousTracks: tracks.slice(0, trackIndex).map((t) => t.id),
    nextTracks: tracks.slice(trackIndex + 1).map((t) => t.id),
  })
</script>

{#if $releaseQuery.data}
  {@const release = $releaseQuery.data}

  <div class="space-y-4">
    <Header
      title={release.title}
      coverArtSrc={release.imageId !== null
        ? makeImageUrl(release.imageId, { size: 512 })
        : undefined}
      coverArtClickable={!!tracks?.length}
      on:clickCoverArt={() => tracks && playTrack(tracks[0].id, makeQueueData(tracks, 0))}
      class="group/tags"
    >
      <div class="flex items-center gap-2 text-sm" slot="subtitle">
        <CommaList class="text-sm font-bold" items={release.artists} let:item>
          <a class="hover:underline" href="/library/artists/{item.id}">{item.name}</a>
        </CommaList>
        •
        <Tags releaseId={data.id} />
      </div>

      <LinkButton href="/library/releases/{release.id}/edit" kind="outline" slot="buttons"
        >Edit</LinkButton
      >
    </Header>

    {#if $tracksQuery.data}
      {@const tracks = $tracksQuery.data}
      <TrackList
        {tracks}
        favorites={data.tracksQuery.favorite ?? false}
        sortable
        showCoverArt={false}
        on:play={(e) => playTrack(e.detail.track.id, makeQueueData(tracks, e.detail.i))}
      />
    {:else if $tracksQuery.error}
      <p>Something went wrong</p>
    {:else}
      <FullscreenLoader />
    {/if}
  </div>
{:else if $releaseQuery.error}
  <div>{$releaseQuery.error.message}</div>
{:else}
  <FullscreenLoader />
{/if}
