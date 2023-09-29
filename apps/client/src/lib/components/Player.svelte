<script lang="ts">
  import { makeImageUrl } from 'mutils'
  import { onDestroy, onMount } from 'svelte'
  import { createEventDispatcher } from 'svelte/internal'
  import { formatMilliseconds, ifDefined, ifNotNull } from 'utils'

  import { TooltipDefaults, tooltip } from '$lib/actions/tooltip'
  import CommaList from '$lib/atoms/CommaList.svelte'
  import Delay from '$lib/atoms/Delay.svelte'
  import IconButton from '$lib/atoms/IconButton.svelte'
  import Loader from '$lib/atoms/Loader.svelte'
  import Range from '$lib/atoms/Range.svelte'
  import FastForwardIcon from '$lib/icons/FastForwardIcon.svelte'
  import ListIcon from '$lib/icons/ListIcon.svelte'
  import PauseIcon from '$lib/icons/PauseIcon.svelte'
  import PlayIcon from '$lib/icons/PlayIcon.svelte'
  import RewindIcon from '$lib/icons/RewindIcon.svelte'
  import VolumeOffIcon from '$lib/icons/VolumeOffIcon.svelte'
  import VolumeOnIcon from '$lib/icons/VolumeOnIcon.svelte'
  import { createLocalStorageJson } from '$lib/local-storage'
  import { player } from '$lib/now-playing'
  import type { PlayerState } from '$lib/now-playing'
  import { createNowPlayer, createScrobbler } from '$lib/scrobbler'
  import { createScrobbleMutation, createUpdateNowPlayingMutation } from '$lib/services/playback'
  import { createTrackQuery } from '$lib/services/tracks'
  import { getContextClient } from '$lib/trpc'
  import { cn } from '$lib/utils/classes'

  import CoverArt from './CoverArt.svelte'
  import TrackOptions from './TrackOptions.svelte'

  export let track: NonNullable<PlayerState['track']>

  const trpc = getContextClient()
  $: trackId = track.id
  $: nowPlayingTrack = createTrackQuery(trpc, trackId)

  $: durationMs = $player.track?.duration ?? $nowPlayingTrack.data?.duration
  $: formattedDuration = formatMilliseconds(durationMs ?? 0)

  $: formattedCurrentTime = formatMilliseconds((track.currentTime || 0) * 1000)
  $: timeMinWidth = `${Math.max(formattedCurrentTime.length, formattedDuration.length) * 7}px`

  const volume = createLocalStorageJson('volume', 1)
  let previousVolume = 1

  const togglePlaying = () => {
    if ($player.paused) {
      player.play()
    } else {
      player.pause()
    }
  }

  const updateNowPlayingMutation = createUpdateNowPlayingMutation(trpc)
  const { mutate: updateNowPlaying } = $updateNowPlayingMutation

  const scrobbleMutation = createScrobbleMutation(trpc)
  const { mutate: scrobble } = $scrobbleMutation

  onMount(() => {
    const unsubscribeScrobbler = createScrobbler((data) =>
      scrobble({ id: data.id, timestamp: data.startTime })
    )
    const unsubscribeNowPlayer = createNowPlayer((data) => updateNowPlaying({ id: data.id }))
    return () => {
      unsubscribeScrobbler()
      unsubscribeNowPlayer()
    }
  })

  export let queueOpen: boolean
  const dispatch = createEventDispatcher<{ toggleQueue: undefined }>()
  const toggleQueue = () => dispatch('toggleQueue')

  $: if (navigator.mediaSession) {
    navigator.mediaSession.playbackState = $player.paused ? 'paused' : 'playing'
  }
  onDestroy(() => {
    if (navigator.mediaSession) {
      navigator.mediaSession.playbackState = 'none'
    }
  })

  $: {
    if ($nowPlayingTrack.data && navigator.mediaSession) {
      const track = $nowPlayingTrack.data
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title ?? undefined,
        artist: track.artists.map((a) => a.name).join(', '),
        album: track.release?.title ?? undefined,
        artwork:
          ifNotNull(track.imageId, (imageId) =>
            [96, 128, 192, 256, 384, 512].map((size) => ({
              src: makeImageUrl(imageId, { size }),
              sizes: `${size}x${size}`,
              type: 'image/png',
            }))
          ) ?? [],
      })
    }
  }

  if (navigator.mediaSession) {
    navigator.mediaSession.setActionHandler('play', () => player.play())
    navigator.mediaSession.setActionHandler('pause', () => player.pause())
    navigator.mediaSession.setActionHandler('previoustrack', () => player.previousTrack())
    navigator.mediaSession.setActionHandler('nexttrack', () => player.nextTrack())
    navigator.mediaSession.setActionHandler('seekto', (e) => {
      if (e.seekTime !== undefined) {
        player.seek(e.seekTime)
      }
    })
  }

  $: {
    const duration = ifDefined(durationMs, (duration) => duration / 1000)
    const position = $player.track?.currentTime
    if (duration !== undefined && position !== undefined) {
      navigator.mediaSession?.setPositionState({
        duration,
        position,
      })
    }
  }
</script>

<div class="relative flex items-center gap-4 rounded bg-black p-2 pb-[11px] md:pb-2">
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
      <div
        class="flex h-10 w-10 items-center justify-center rounded-sm bg-gray-800 md:h-16 md:w-16"
      >
        <Delay>
          <Loader class="h-6 w-6 text-gray-600 md:h-8 md:w-8" />
        </Delay>
      </div>
    {/if}
  </div>

  <div class="ml-auto flex justify-center md:ml-[unset] md:flex-1 xl:flex-[4]">
    <div class="w-full max-w-[722px]">
      <div class="flex w-full items-center justify-center gap-3.5">
        <button
          type="button"
          class="sm:center hidden h-8 w-8 text-gray-400 transition hover:text-white"
          use:tooltip={{ content: 'Previous', delay: [2000, TooltipDefaults.delay] }}
          on:click={() => player.previousTrack()}
        >
          <RewindIcon class="h-6 w-6" />
        </button>
        <button
          type="button"
          class="flex h-10 w-10 items-center justify-center transition-transform duration-[50] hover:scale-[1.06] hover:transform active:scale-[.99] active:transform active:transition-none"
          on:click={togglePlaying}
          use:tooltip={{
            content: $player.paused ? 'Play' : 'Pause',
            delay: [2000, TooltipDefaults.delay],
          }}
        >
          {#if $player.paused}
            <PlayIcon />
          {:else}
            <PauseIcon />
          {/if}
        </button>
        <button
          type="button"
          class="sm:center hidden h-8 w-8 text-gray-400 transition hover:text-white"
          use:tooltip={{ content: 'Next', delay: [2000, TooltipDefaults.delay] }}
          on:click={() => player.nextTrack()}
        >
          <FastForwardIcon class="h-6 w-6" />
        </button>
      </div>
      <div
        class="absolute inset-x-2 -bottom-2 flex items-center gap-2 md:relative md:inset-x-[unset] md:bottom-[unset]"
      >
        <div
          class="hidden text-right text-xs text-gray-400 md:block"
          style:min-width={timeMinWidth}
        >
          {formattedCurrentTime}
        </div>
        <div class="flex-1">
          <Range
            bind:value={track.currentTime}
            min={0}
            max={(durationMs ?? 1000) / 1000}
            height="h-[3px]"
            on:change={(e) => {
              player.seek(e.detail)
            }}
          />
        </div>
        <div class="hidden text-xs text-gray-400 md:block" style:min-width={timeMinWidth}>
          {formattedDuration}
        </div>
      </div>
    </div>
  </div>

  <div class="hidden items-center justify-end gap-1 md:flex">
    <IconButton
      kind="text"
      tooltip="Queue"
      layer="black"
      class={cn(queueOpen && 'text-primary-600')}
      on:click={toggleQueue}
    >
      <ListIcon />
    </IconButton>
    <IconButton
      kind="text"
      layer="black"
      tooltip={$volume === 0 ? 'Unmute' : 'Mute'}
      on:click={() => {
        if ($volume === 0) {
          $volume = previousVolume
        } else {
          previousVolume = $volume
          $volume = 0
        }
      }}
    >
      {#if $volume === 0}
        <VolumeOffIcon />
      {:else}
        <VolumeOnIcon />
      {/if}
    </IconButton>

    <div class="mr-4 hidden w-[125px] lg:block">
      <Range bind:value={$volume} min={0} max={1} />
    </div>
  </div>
</div>
