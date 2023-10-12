<script lang="ts">
  import { makeImageUrl } from 'mutils'

  import rymLogo from '$lib/assets/sonemic-32.png'
  import Button from '$lib/atoms/Button.svelte'
  import CommaList from '$lib/atoms/CommaList.svelte'
  import LinkButton from '$lib/atoms/LinkButton.svelte'
  import Loader from '$lib/atoms/Loader.svelte'
  import FullscreenLoader from '$lib/components/FullscreenLoader.svelte'
  import TrackList from '$lib/components/TrackList.svelte'
  import { getContextDialogs } from '$lib/dialogs/dialogs'
  import { player } from '$lib/now-playing'
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

  $: rymLinksQuery = trpc.releases.getRymLinks.query({ id: data.id })

  const makeQueueData = (tracks: RouterOutput['tracks']['getByReleaseId'], trackIndex: number) => ({
    previousTracks: tracks.slice(0, trackIndex).map((t) => t.id),
    nextTracks: tracks.slice(trackIndex + 1).map((t) => t.id),
  })

  const dialogs = getContextDialogs()
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
      on:clickCoverArt={() => tracks && player.playTrack(tracks[0].id, makeQueueData(tracks, 0))}
      class="group/tags"
    >
      <div class="flex items-center gap-2 text-sm" slot="subtitle">
        <CommaList class="text-sm font-bold" items={release.artists} let:item>
          <a class="hover:underline" href="/library/artists/{item.id}">{item.name}</a>
        </CommaList>
        •
        <Tags releaseId={data.id} />
      </div>

      <svelte:fragment slot="buttons">
        <Button kind="text" on:click={() => dialogs.open('delete-release', { release })}>
          Delete
        </Button>
        <LinkButton href="/library/releases/{release.id}/edit" kind="outline">Edit</LinkButton>
      </svelte:fragment>
    </Header>

    {#if $tracksQuery.data}
      {@const tracks = $tracksQuery.data}
      <TrackList
        {tracks}
        favorites={data.tracksQuery.favorite ?? false}
        sortable
        showCoverArt={false}
        on:play={(e) => player.playTrack(e.detail.track.id, makeQueueData(tracks, e.detail.i))}
        class="mb-7"
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

{#if $rymLinksQuery.isLoading || ($rymLinksQuery.data && $rymLinksQuery.data.length > 0)}
  <div
    class="absolute bottom-0 right-0 mb-1 mt-2 hidden h-7 max-w-full justify-center rounded border border-gray-700 bg-gray-800 p-1 shadow md:flex"
  >
    {#if $rymLinksQuery.data}
      {#if $rymLinksQuery.data.length > 0}
        <a href={$rymLinksQuery.data[0].url} target="_blank" class="h-full">
          <img
            src={rymLogo}
            class="h-full grayscale transition-all hover:grayscale-0"
            alt="RateYourMusic"
          />
        </a>
      {/if}
    {:else if $rymLinksQuery.isLoading}
      <Loader class="text-gray-600" />
    {/if}
  </div>
{/if}
