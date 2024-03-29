<script lang="ts">
  import { fade } from 'svelte/transition'
  import { equalsWithOrder, isDefined } from 'utils'

  import { autoscroll } from '$lib/actions/autoscroll'
  import Delay from '$lib/atoms/Delay.svelte'
  import Loader from '$lib/atoms/Loader.svelte'
  import { player } from '$lib/now-playing'
  import { createTracksQuery } from '$lib/services/tracks'
  import { getContextClient } from '$lib/trpc'
  import { tw } from '$lib/utils/classes'

  import TrackList from './TrackList.svelte'

  let class_: string | undefined = undefined
  export { class_ as class }

  const trpc = getContextClient()

  const makeTracks = () =>
    [...$player.previousTracks, $player.track?.id, ...$player.nextTracks].filter(isDefined)
  let tracks: number[] = makeTracks()
  $: {
    const newTracks = makeTracks()
    if (!equalsWithOrder(tracks, newTracks)) {
      tracks = newTracks
    }
  }

  $: tracksQuery = createTracksQuery(trpc, tracks)
</script>

<div
  class={tw(
    'space-y-4 overflow-auto rounded bg-gray-900 bg-opacity-95 p-2 backdrop-blur-md',
    class_
  )}
>
  {#if $tracksQuery.data}
    {@const previousTracks = $tracksQuery.data.filter((t) => $player.previousTracks.includes(t.id))}
    {@const nowPlayingTrack = $tracksQuery.data.find((t) => t.id === $player.track?.id)}
    {@const nextTracks = $tracksQuery.data.filter((t) => $player.nextTracks.includes(t.id))}

    {#if previousTracks.length}
      <div>
        <h6 class="mb-1 ml-1 font-semibold text-gray-400">Previous</h6>
        <TrackList tracks={previousTracks} />
      </div>
    {/if}

    <div use:autoscroll>
      <h6 class="text-primary-500 mb-1 ml-1 font-bold">Now playing</h6>
      {#if nowPlayingTrack}
        <TrackList tracks={[nowPlayingTrack]} />
      {/if}
    </div>

    {#if nextTracks.length}
      <div>
        <h6 class="mb-1 ml-1 font-semibold text-gray-400">Next</h6>
        <TrackList tracks={nextTracks} />
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
