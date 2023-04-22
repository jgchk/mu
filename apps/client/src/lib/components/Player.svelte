<script lang="ts">
  import { onDestroy, onMount } from 'svelte'
  import { createEventDispatcher, raf } from 'svelte/internal'
  import { formatMilliseconds } from 'utils'

  import { tooltip, TooltipDefaults } from '$lib/actions/tooltip'
  import IconButton from '$lib/atoms/IconButton.svelte'
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

  import Range from '../atoms/Range.svelte'
  import AddToPlaylistButton from './AddToPlaylistButton.svelte'
  import CoverArt from './CoverArt.svelte'
  import FavoriteButton from './FavoriteButton.svelte'

  export let track: NonNullable<NowPlaying['track']>

  const trpc = getContextClient()
  $: trackId = track.id
  $: nowPlayingTrack = createTrackQuery(trpc, trackId)

  $: favoriteMutation = createFavoriteTrackMutation(trpc, { getTrackByIdQuery: { id: trackId } })

  $: formattedCurrentTime = formatMilliseconds((track.currentTime || 0) * 1000)
  $: formattedDuration = formatMilliseconds($nowPlayingTrack.data?.duration ?? 0)
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
</script>

<div class="flex items-center gap-4 rounded bg-black p-2">
  <div class="flex min-w-[180px] flex-[3] items-center gap-4">
    {#if $nowPlayingTrack.data}
      {@const track = $nowPlayingTrack.data}
      <a href="/releases/{track.releaseId}" class="h-16 w-16 shrink-0">
        <CoverArt
          src={track.imageId !== null ? makeImageUrl(track.imageId, { size: 128 }) : undefined}
          alt={track.title}
          placeholderClass="text-[8px]"
        />
      </a>

      <div class="overflow-hidden">
        <div class="truncate">
          {track.title}
        </div>
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

      <div class="flex items-center gap-1">
        <FavoriteButton
          layer="black"
          favorite={track.favorite}
          on:click={() => $favoriteMutation.mutate({ id: track.id, favorite: !track.favorite })}
        />
        <AddToPlaylistButton trackId={track.id} layer="black" offset={32} />
      </div>
    {:else if $nowPlayingTrack.error}
      <div>{$nowPlayingTrack.error.message}</div>
    {:else}
      <div class="h-[64px] w-[64px] rounded-sm bg-gray-800" />
      <div>
        <div class="invisible">Loading...</div>
        <div class="invisible text-sm text-gray-400">Loading...</div>
      </div>
    {/if}
  </div>
  <div class="max-w-[722px] flex-[4]">
    <div class="flex w-full items-center justify-center gap-3.5">
      <button
        type="button"
        class="center h-8 w-8 text-gray-400 transition hover:text-white"
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
        class="center h-8 w-8 text-gray-400 transition hover:text-white"
        use:tooltip={{ content: 'Next', delay: [2000, TooltipDefaults.delay] }}
        on:click={() => nextTrack()}
      >
        <FastForwardIcon class="h-6 w-6" />
      </button>
    </div>
    <div class="flex items-center gap-2">
      <div class="text-right text-xs text-gray-400" style:min-width={timeMinWidth}>
        {formattedCurrentTime}
      </div>
      <div class="flex-1">
        <Range
          bind:value={track.currentTime}
          min={0}
          max={track.duration ?? 1}
          on:change={(e) => {
            if (player) {
              player.currentTime = e.detail
            }
          }}
        />
      </div>
      <div class="text-xs text-gray-400" style:min-width={timeMinWidth}>
        {formattedDuration}
      </div>
    </div>
  </div>
  <div class="flex flex-[2.25] items-center justify-end gap-1">
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
    <div class="mr-4 w-[125px]">
      <Range bind:value={$volume} min={0} max={1} />
    </div>
  </div>
</div>

{#if $nowPlaying.track}
  {#key $nowPlaying.track.__playSignal}
    <audio
      autoplay
      class="hidden"
      bind:this={player}
      bind:paused
      bind:volume={$volume}
      on:ended={() => nextTrack()}
      on:timeupdate={handleTimeUpdate}
      on:durationchange={(e) => {
        if ($nowPlaying.track) {
          $nowPlaying.track.duration = e.currentTarget.duration
        }
      }}
    >
      <source src="/api/tracks/{track.id}/stream" type="audio/mpeg" />
    </audio>
  {/key}
{/if}
