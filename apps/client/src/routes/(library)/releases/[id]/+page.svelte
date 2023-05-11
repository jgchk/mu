<script lang="ts">
  import CommaList from '$lib/atoms/CommaList.svelte'
  import LinkButton from '$lib/atoms/LinkButton.svelte'
  import CoverArt from '$lib/components/CoverArt.svelte'
  import FullscreenLoader from '$lib/components/FullscreenLoader.svelte'
  import TrackList from '$lib/components/TrackList.svelte'
  import { makeImageUrl } from '$lib/cover-art'
  import PlayIcon from '$lib/icons/PlayIcon.svelte'
  import { playTrack } from '$lib/now-playing'
  import { createReleaseTracksQuery, createReleaseWithArtistsQuery } from '$lib/services/releases'
  import { createFavoriteTrackMutation } from '$lib/services/tracks'
  import type { RouterOutput } from '$lib/trpc'
  import { getContextClient } from '$lib/trpc'

  import type { PageData } from './$types'
  import Tags from './Tags.svelte'

  export let data: PageData

  const trpc = getContextClient()
  $: releaseQuery = createReleaseWithArtistsQuery(trpc, data.id)
  $: tracksQuery = createReleaseTracksQuery(trpc, data.tracksQuery)
  $: tracks = $tracksQuery.data

  $: favoriteMutation = createFavoriteTrackMutation(trpc, {
    getReleaseTracksQuery: { id: data.id },
  })

  const makeQueueData = (tracks: RouterOutput['releases']['tracks'], trackIndex: number) => ({
    previousTracks: tracks.slice(0, trackIndex).map((t) => t.id),
    nextTracks: tracks.slice(trackIndex + 1).map((t) => t.id),
  })
</script>

{#if $releaseQuery.data}
  {@const release = $releaseQuery.data}

  <div class="space-y-4">
    <div class="group/tags relative flex flex-col items-center gap-6 sm:flex-row sm:items-end">
      <button
        type="button"
        class="relative w-64 max-w-full shrink-0 overflow-hidden sm:w-32 lg:w-48 xl:w-64"
        disabled={!tracks?.length}
        on:click={() => tracks && playTrack(tracks[0].id, makeQueueData(tracks, 0))}
      >
        <CoverArt
          src={release.imageId !== null ? makeImageUrl(release.imageId, { size: 512 }) : undefined}
          alt={release.title}
          iconClass="w-8 h-8 lg:w-16 lg:h-16"
          hoverable={!!tracks?.length}
        >
          <PlayIcon />
        </CoverArt>
      </button>

      <div class="space-y-1 self-start px-1.5 pb-2 md:px-0">
        <h1
          class="mr-11 line-clamp-2 break-all text-2xl font-bold leading-[1.19] sm:text-3xl md:text-4xl xl:text-5xl 2xl:text-6xl"
          title={release.title}
        >
          {release.title}
        </h1>
        <div class="flex items-center gap-2 text-sm">
          <CommaList class="text-sm font-bold" items={release.artists} let:item>
            <a class="hover:underline" href="/artists/{item.id}">{item.name}</a>
          </CommaList>
          •
          <Tags releaseId={data.id} />
        </div>
      </div>

      <LinkButton
        href="/releases/{release.id}/edit"
        kind="outline"
        class="absolute bottom-4 right-0 md:bottom-[unset] md:top-0"
      >
        Edit
      </LinkButton>
    </div>

    {#if $tracksQuery.data}
      {@const tracks = $tracksQuery.data}
      <TrackList
        {tracks}
        favorites={data.tracksQuery.favorite ?? false}
        sortable
        showCoverArt={false}
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
{:else if $releaseQuery.error}
  <div>{$releaseQuery.error.message}</div>
{:else}
  <FullscreenLoader />
{/if}
