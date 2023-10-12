<script lang="ts">
  import { makeImageUrl } from 'mutils'

  import CommaList from '$lib/atoms/CommaList.svelte'
  import Delay from '$lib/atoms/Delay.svelte'
  import Loader from '$lib/atoms/Loader.svelte'
  import { createTrackQuery } from '$lib/services/tracks'
  import { getContextClient } from '$lib/trpc'

  import CoverArt from './CoverArt.svelte'
  import TrackOptions from './TrackOptions.svelte'

  export let trackId: number

  const trpc = getContextClient()

  $: nowPlayingTrack = createTrackQuery(trpc, trackId)
</script>

<div class="flex min-w-[180px] flex-1 items-center gap-4 lg:flex-[3]">
  {#if $nowPlayingTrack.data}
    {@const track = $nowPlayingTrack.data}
    <a href="/library/releases/{track.releaseId}" class="w-10 shrink-0 md:w-16">
      <CoverArt
        src={track.imageId !== null ? makeImageUrl(track.imageId, { size: 128 }) : undefined}
        alt={track.title}
        rounding="rounded-sm md:rounded"
        placeholderClass="text-[8px]"
      />
    </a>

    <div class="flex-1 overflow-hidden md:flex-[unset]">
      <div class="truncate text-sm font-medium md:text-base">
        {track.title}
      </div>
      <div class="truncate text-xs text-gray-400 md:text-sm">
        <CommaList items={track.artists} let:item>
          <a class="hover:underline" href="/library/artists/{item.id}">{item.name}</a>
        </CommaList>
      </div>
    </div>

    <TrackOptions {track} layer="black" />
  {:else if $nowPlayingTrack.error}
    <div>{$nowPlayingTrack.error.message}</div>
  {:else}
    <div class="flex h-10 w-10 items-center justify-center rounded-sm bg-gray-800 md:h-16 md:w-16">
      <Delay>
        <Loader class="h-6 w-6 text-gray-600 md:h-8 md:w-8" />
      </Delay>
    </div>
  {/if}
</div>
