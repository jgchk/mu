<script lang="ts">
  import { makeImageUrl } from 'mutils'
  import { createEventDispatcher } from 'svelte'
  import { formatMilliseconds } from 'utils'

  import CommaList from '$lib/atoms/CommaList.svelte'
  import PlayIcon from '$lib/icons/PlayIcon.svelte'
  import PlayingIcon from '$lib/icons/PlayingIcon.svelte'
  import { player } from '$lib/now-playing'
  import { cn } from '$lib/utils/classes'

  import CoverArt from './CoverArt.svelte'
  import type { TrackListTrack as TrackListTrackType } from './TrackList'
  import TrackOptions from './TrackOptions.svelte'

  export let track: TrackListTrackType
  export let showCoverArt = true
  export let i: number
  export let showDelete = false

  const dispatch = createEventDispatcher<{
    play: undefined
    delete: undefined
  }>()
  const play = () => dispatch('play')

  $: isCurrentTrack = $player.track?.id === track.id
</script>

<div
  class={cn(
    'group/track grid select-none items-center gap-2 rounded p-1.5 hover:bg-gray-700',
    track.release
      ? 'grid-cols-[auto_6fr_auto] md:grid-cols-[auto_6fr_4fr_1fr_auto]'
      : 'grid-cols-[auto_6fr_auto] md:grid-cols-[auto_6fr_1fr_auto]'
  )}
  on:dblclick={() => play()}
>
  {#if showCoverArt}
    <button type="button" class="relative block h-11 w-11" on:click={() => play()}>
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
  {:else}
    <div class="center relative h-11 w-8">
      <div
        class={cn(
          'text-sm font-medium group-hover/track:opacity-0',
          isCurrentTrack ? 'text-primary-500' : 'text-gray-400'
        )}
      >
        {#if isCurrentTrack && !$player.paused}
          <PlayingIcon class="h-5 w-5" />
        {:else}
          {i + 1}
        {/if}
      </div>
      <button
        type="button"
        class="hover:text-primary-500 absolute h-6 w-6 opacity-0 transition-colors group-hover/track:opacity-100"
        on:click={() => play()}
      >
        <PlayIcon />
      </button>
    </div>
  {/if}

  <div class="overflow-hidden">
    <div class={cn('truncate font-medium', isCurrentTrack && 'text-primary-500')}>
      {track.title || '[untitled]'}
    </div>
    <div class="truncate text-sm text-gray-400">
      <CommaList items={track.artists} let:item>
        <a class="hover:underline" href="/library/artists/{item.id}">{item.name}</a>
      </CommaList>
    </div>
  </div>

  {#if track.release}
    <div class="hidden truncate text-sm text-gray-400 md:block">
      <a
        class="hover:underline group-hover/track:text-white"
        href="/library/releases/{track.release.id}"
        >{#if track.release.title}
          {track.release.title}
        {:else}
          [untitled]
        {/if}
      </a>
    </div>
  {/if}

  <div class="hidden justify-self-end text-sm text-gray-400 md:block">
    {formatMilliseconds(track.duration)}
  </div>

  <TrackOptions layer={700} {track} {showDelete} on:delete={() => dispatch('delete')} />
</div>
