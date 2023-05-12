<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import { createEventDispatcher, raf } from 'svelte/internal'
  import { formatMilliseconds } from 'utils'

  import { TooltipDefaults, tooltip } from '$lib/actions/tooltip'
  import CommaList from '$lib/atoms/CommaList.svelte'
  import Delay from '$lib/atoms/Delay.svelte'
  import IconButton from '$lib/atoms/IconButton.svelte'
  import Loader from '$lib/atoms/Loader.svelte'
  import Range from '$lib/atoms/Range.svelte'
  import { makeImageUrl } from '$lib/cover-art'
  import FastForwardIcon from '$lib/icons/FastForwardIcon.svelte'
  import ListIcon from '$lib/icons/ListIcon.svelte'
  import PauseIcon from '$lib/icons/PauseIcon.svelte'
  import PlayIcon from '$lib/icons/PlayIcon.svelte'
  import RewindIcon from '$lib/icons/RewindIcon.svelte'
  import VolumeOffIcon from '$lib/icons/VolumeOffIcon.svelte'
  import VolumeOnIcon from '$lib/icons/VolumeOnIcon.svelte'
  import { createLocalStorageJson } from '$lib/local-storage'
  import type { NowPlaying } from '$lib/now-playing'
  import { nextTrack, nowPlaying, previousTrack } from '$lib/now-playing'
  import { createNowPlayer, createScrobbler } from '$lib/scrobbler'
  import { createScrobbleMutation, createUpdateNowPlayingMutation } from '$lib/services/playback'
  import { createFavoriteTrackMutation, createTrackQuery } from '$lib/services/tracks'
  import { getContextClient } from '$lib/trpc'
  import { cn } from '$lib/utils/classes'

  import AddToPlaylistButton from './AddToPlaylistButton.svelte'
  import CoverArt from './CoverArt.svelte'
  import FavoriteButton from './FavoriteButton.svelte'
  import TrackTagsButton from './TrackTagsButton.svelte'

  export let track: NonNullable<NowPlaying['track']>

  const trpc = getContextClient()
  $: trackId = track.id
  $: nowPlayingTrack = createTrackQuery(trpc, trackId)

  $: favoriteMutation = createFavoriteTrackMutation(trpc, { getTrackByIdQuery: { id: trackId } })

  $: durationMs = $nowPlaying.track?.duration ?? $nowPlayingTrack.data?.duration
  $: formattedDuration = formatMilliseconds(durationMs ?? 0)

  $: formattedCurrentTime = formatMilliseconds((track.currentTime || 0) * 1000)
  $: timeMinWidth = `${Math.max(formattedCurrentTime.length, formattedDuration.length) * 7}px`

  const volume = createLocalStorageJson('volume', 1)
  let previousVolume = 1

  let player: HTMLAudioElement | undefined
  let paused = false

  onDestroy(() => {
    player?.pause()
  })

  const togglePlaying = () => {
    if (player?.paused) {
      play()
    } else {
      pause()
    }
  }
  const play = () => {
    void player?.play()
  }
  const pause = () => {
    player?.pause()
  }

  let audioAnimationFrame: number | void
  function handleTimeUpdate() {
    if (audioAnimationFrame !== void 0) {
      cancelAnimationFrame(audioAnimationFrame)
    }

    if (!player?.paused) {
      audioAnimationFrame = raf(handleTimeUpdate)
    }

    if ($nowPlaying.track) {
      $nowPlaying.track.currentTime = player?.currentTime
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

  navigator.mediaSession.setActionHandler('play', () => play())
  navigator.mediaSession.setActionHandler('pause', () => pause())
  // navigator.mediaSession.setActionHandler('seekbackward', function () {})
  // navigator.mediaSession.setActionHandler('seekforward', function () {})
  navigator.mediaSession.setActionHandler('previoustrack', () => previousTrack())
  navigator.mediaSession.setActionHandler('nexttrack', () => nextTrack())
</script>

<div class="relative flex items-center gap-4 rounded bg-black p-2 pb-[11px] md:pb-2">
  <div class="flex min-w-[180px] max-w-fit flex-1 items-center gap-4 lg:flex-[3]">
    {#if $nowPlayingTrack.data}
      {@const track = $nowPlayingTrack.data}
      <a href="/releases/{track.releaseId}" class="w-10 shrink-0 md:w-16">
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
            <a class="hover:underline" href="/artists/{item.id}">{item.name}</a>
          </CommaList>
        </div>
      </div>

      <div class="flex items-center gap-1">
        <FavoriteButton
          layer="black"
          favorite={track.favorite}
          on:click={() => $favoriteMutation.mutate({ id: track.id, favorite: !track.favorite })}
        />
        <AddToPlaylistButton trackId={track.id} layer="black" />
        <TrackTagsButton trackId={track.id} layer="black" />
      </div>
    {:else if $nowPlayingTrack.error}
      <div>{$nowPlayingTrack.error.message}</div>
    {:else}
      <div class="flex h-[64px] w-[64px] items-center justify-center rounded-sm bg-gray-800">
        <Delay>
          <Loader class="h-8 w-8 text-gray-600" />
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
          on:click={() => previousTrack()}
        >
          <RewindIcon class="h-6 w-6" />
        </button>
        <button
          type="button"
          class="flex h-10 w-10 items-center justify-center transition-transform duration-[50] hover:scale-[1.06] hover:transform active:scale-[.99] active:transform active:transition-none"
          on:click={togglePlaying}
          use:tooltip={{ content: paused ? 'Play' : 'Pause', delay: [2000, TooltipDefaults.delay] }}
        >
          {#if paused}
            <PlayIcon />
          {:else}
            <PauseIcon />
          {/if}
        </button>
        <button
          type="button"
          class="sm:center hidden h-8 w-8 text-gray-400 transition hover:text-white"
          use:tooltip={{ content: 'Next', delay: [2000, TooltipDefaults.delay] }}
          on:click={() => nextTrack()}
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
              if (player) {
                player.currentTime = e.detail
              }
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

{#if $nowPlaying.track}
  <audio
    autoplay
    class="hidden"
    bind:this={player}
    bind:paused
    bind:volume={$volume}
    on:ended={nextTrack}
    on:timeupdate={handleTimeUpdate}
    on:durationchange={(e) => {
      const durationSec = e.currentTarget.duration
      if ($nowPlaying.track && durationSec !== Infinity) {
        $nowPlaying.track.duration = durationSec * 1000
      }
    }}
    src="/api/tracks/{track.id}/stream"
  />
{/if}
