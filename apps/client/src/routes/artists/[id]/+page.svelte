<script lang="ts">
  import { formatMilliseconds, isNotNull } from 'utils'

  import AddToPlaylistButton from '$lib/components/AddToPlaylistButton.svelte'
  import CoverArt from '$lib/components/CoverArt.svelte'
  import FavoriteButton from '$lib/components/FavoriteButton.svelte'
  import FlowGrid from '$lib/components/FlowGrid.svelte'
  import { makeCollageUrl, makeImageUrl } from '$lib/cover-art'
  import PlayIcon from '$lib/icons/PlayIcon.svelte'
  import { playTrack } from '$lib/now-playing'
  import { createFullArtistQuery } from '$lib/services/artists'
  import { createFavoriteTrackMutation } from '$lib/services/tracks'
  import type { RouterOutput } from '$lib/trpc'
  import { getContextClient } from '$lib/trpc'

  import type { PageData } from './$types'

  export let data: PageData

  const trpc = getContextClient()
  const artistQuery = createFullArtistQuery(trpc, data.id)

  $: favoriteMutation = createFavoriteTrackMutation(trpc, {
    getFullArtistQuery: { id: data.id },
  })

  const makeQueueData = (
    tracks: RouterOutput['artists']['getFull']['tracks'],
    trackIndex: number
  ) => ({
    previousTracks: tracks.slice(0, trackIndex).map((t) => t.id),
    nextTracks: tracks.slice(trackIndex + 1).map((t) => t.id),
  })
</script>

{#if $artistQuery.data}
  {@const artist = $artistQuery.data}
  {@const tracks = artist.tracks}
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
    <div>
      {#each tracks as track, i (track.id)}
        <div
          class="group flex select-none items-center gap-2 rounded p-1.5 hover:bg-gray-700"
          on:dblclick={() => playTrack(track.id, makeQueueData(tracks, i))}
        >
          <button
            type="button"
            class="relative h-11 w-11 shadow"
            on:click={() => playTrack(track.id, makeQueueData(tracks, i))}
          >
            <CoverArt
              src={track.imageId !== null ? makeImageUrl(track.imageId, { size: 80 }) : undefined}
              alt={track.title}
              iconClass="w-5 h-5"
              placeholderClass="text-[5px]"
              rounding="rounded-sm"
            >
              <PlayIcon />
            </CoverArt>
          </button>
          <div class="flex-1 truncate">
            {track.title}
            <ul class="comma-list text-sm text-gray-400">
              {#each track.artists as artist (artist.id)}
                <li class="flex">
                  <a class="hover:underline group-hover:text-white" href="/artists/{artist.id}"
                    >{artist.name}</a
                  >
                </li>
              {/each}
            </ul>
          </div>
          <div class="flex-[2] truncate text-sm text-gray-400">
            {#if track.release}
              <a class="hover:underline group-hover:text-white" href="/releases/{track.release.id}"
                >{#if track.release.title}
                  {track.release.title}
                {:else}
                  [untitled]
                {/if}
              </a>
            {/if}
          </div>
          <div class="text-sm text-gray-400">
            {formatMilliseconds(track.duration)}
          </div>
          <div class="flex items-center gap-1">
            <FavoriteButton
              layer={700}
              favorite={track.favorite}
              on:click={() => $favoriteMutation.mutate({ id: track.id, favorite: !track.favorite })}
            />
            <AddToPlaylistButton trackId={track.id} layer={700} />
          </div>
        </div>
      {/each}
    </div>
  </div>
{:else if $artistQuery.error}
  <p>Something went wrong</p>
{:else}
  <p>Loading...</p>
{/if}
