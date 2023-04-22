<script lang="ts">
  import { fade } from 'svelte/transition'
  import { equalsWithOrder, isDefined } from 'utils'

  import { autoscroll } from '$lib/actions/autoscroll'
  import Loader from '$lib/atoms/Loader.svelte'
  import { nowPlaying } from '$lib/now-playing'
  import { createFavoriteTrackMutation, createTracksQuery } from '$lib/services/tracks'
  import { getContextClient } from '$lib/trpc'

  import Delay from './Delay.svelte'
  import TrackList from './TrackList.svelte'

  const trpc = getContextClient()

  const makeTracks = () =>
    [...$nowPlaying.previousTracks, $nowPlaying.track?.id, ...$nowPlaying.nextTracks].filter(
      isDefined
    )
  let tracks: number[] = makeTracks()
  $: {
    const newTracks = makeTracks()
    if (!equalsWithOrder(tracks, newTracks)) {
      tracks = newTracks
    }
  }

  $: tracksQuery = createTracksQuery(trpc, tracks)
  $: favoriteMutation = createFavoriteTrackMutation(trpc, {
    getManyTracksQuery: { ids: tracks },
  })
</script>

<div class="h-full w-full space-y-4 overflow-auto rounded bg-black p-4">
  {#if $tracksQuery.data}
    {@const previousTracks = $tracksQuery.data.filter((t) =>
      $nowPlaying.previousTracks.includes(t.id)
    )}
    {@const nowPlayingTrack = $tracksQuery.data.find((t) => t.id === $nowPlaying.track?.id)}
    {@const nextTracks = $tracksQuery.data.filter((t) => $nowPlaying.nextTracks.includes(t.id))}

    {#if previousTracks.length}
      <div>
        <h6 class="mb-1 font-bold text-gray-400">Previous</h6>
        <TrackList
          tracks={previousTracks}
          on:favorite={(e) =>
            $favoriteMutation.mutate({ id: e.detail.track.id, favorite: e.detail.favorite })}
        />
      </div>
    {/if}

    <div use:autoscroll>
      <h6 class="text-primary-600 mb-1 font-bold">Now playing</h6>
      {#if nowPlayingTrack}
        <TrackList
          tracks={[nowPlayingTrack]}
          on:favorite={(e) =>
            $favoriteMutation.mutate({ id: e.detail.track.id, favorite: e.detail.favorite })}
        />
      {/if}
    </div>

    {#if nextTracks.length}
      <div>
        <h6 class="mb-1 font-bold text-gray-400">Next</h6>
        <TrackList
          tracks={nextTracks}
          on:favorite={(e) =>
            $favoriteMutation.mutate({ id: e.detail.track.id, favorite: e.detail.favorite })}
        />
      </div>
    {/if}
  {:else if $tracksQuery.error}
    <div class="text-red-500">Error: {$tracksQuery.error.message}</div>
  {:else}
    <Delay>
      <div class="flex h-full max-h-72 items-center justify-center" in:fade|local>
        <Loader class="h-10 w-10 text-gray-600" />
      </div>
    </Delay>
  {/if}
</div>
