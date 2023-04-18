<script lang="ts">
  import { inview } from 'svelte-inview'
  import { formatMilliseconds, ifDefined } from 'utils'

  import Button from '$lib/atoms/Button.svelte'
  import CoverArt from '$lib/components/CoverArt.svelte'
  import FavoriteButton from '$lib/components/FavoriteButton.svelte'
  import { makeImageUrl } from '$lib/cover-art'
  import PlayIcon from '$lib/icons/PlayIcon.svelte'
  import { playTrack } from '$lib/now-playing'
  import {
    createAllTracksWithArtistsAndReleaseQuery,
    createFavoriteTrackMutation,
  } from '$lib/services/tracks'
  import { getContextToast } from '$lib/toast/toast'
  import { getContextClient } from '$lib/trpc'
  import { cn } from '$lib/utils/classes'

  import type { PageData } from './$types'
  import { makeTracksQueryInput } from './common'

  export let data: PageData

  $: tracksQueryInput = makeTracksQueryInput(data.favoritesOnly)

  const trpc = getContextClient()
  $: tracksQuery = createAllTracksWithArtistsAndReleaseQuery(trpc, tracksQueryInput)
  $: tracks = ifDefined($tracksQuery.data, (data) => data.pages.flatMap((page) => page.items))

  $: favoriteMutation = createFavoriteTrackMutation(trpc, {
    getAllTracksWithArtistsAndReleaseQuery: tracksQueryInput,
  })

  let inView = false
  $: {
    if (inView && $tracksQuery.hasNextPage && !$tracksQuery.isFetchingNextPage) {
      void $tracksQuery.fetchNextPage()
    }
  }

  const toast = getContextToast()
  function makeQueueData(trackIndex: number) {
    if (!tracks) {
      toast.warning('Could not queue additional tracks')
      return {
        previousTracks: [],
        nextTracks: [],
      }
    }

    return {
      previousTracks: tracks.slice(0, trackIndex).map((t) => t.id),
      nextTracks: tracks.slice(trackIndex + 1).map((t) => t.id),
    }
  }
</script>

<div class="flex h-full gap-2">
  <div class="w-48 min-w-fit rounded bg-gray-900 py-2">
    <a
      href={data.favoritesOnly ? '/tracks' : '/tracks?favorites=true'}
      class={cn(
        'flex h-10 w-full items-center px-4 hover:text-white',
        data.favoritesOnly ? 'text-white' : 'text-gray-500'
      )}
    >
      Favorites
    </a>
  </div>
  <div class="h-full flex-1 overflow-auto">
    {#if tracks}
      <div class="p-4">
        {#each tracks as track, i (track.id)}
          <div
            class="group flex select-none items-center gap-2 rounded p-1.5 hover:bg-gray-700"
            on:dblclick={() => playTrack(track.id, makeQueueData(i))}
          >
            <button
              type="button"
              class="relative h-11 w-11 shadow"
              on:click={() => playTrack(track.id, makeQueueData(i))}
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
                <a
                  class="hover:underline group-hover:text-white"
                  href="/releases/{track.release.id}"
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
            <FavoriteButton
              favorite={track.favorite}
              on:click={() => $favoriteMutation.mutate({ id: track.id, favorite: !track.favorite })}
            />
          </div>
        {/each}

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
      </div>
    {:else if $tracksQuery.error}
      <div>{$tracksQuery.error.message}</div>
    {:else}
      <div>Loading...</div>
    {/if}
  </div>
</div>
