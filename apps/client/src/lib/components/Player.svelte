<script lang="ts">
  import { onDestroy, onMount } from 'svelte'

  import { tooltip, TooltipDefaults } from '$lib/actions/tooltip'
  import FastForwardIcon from '$lib/icons/FastForwardIcon.svelte'
  import PauseIcon from '$lib/icons/PauseIcon.svelte'
  import PlayIcon from '$lib/icons/PlayIcon.svelte'
  import RewindIcon from '$lib/icons/RewindIcon.svelte'
  import VolumeOffIcon from '$lib/icons/VolumeOffIcon.svelte'
  import VolumeOnIcon from '$lib/icons/VolumeOnIcon.svelte'
  import { createLocalStorageJson } from '$lib/local-storage'
  import { nextTrack, nowPlaying, previousTrack } from '$lib/now-playing'
  import { createNowPlayer, createScrobbler } from '$lib/scrobbler'
  import { getContextClient } from '$lib/trpc'
  import { formatMilliseconds } from '$lib/utils/date'

  import Range from '../atoms/Range.svelte'
  import CoverArt from './CoverArt.svelte'

  export let trackId: number
  export let __playSignal: symbol
  export let currentTime: number | undefined
  export let duration: number | undefined

  const trpc = getContextClient()
  $: nowPlayingTrack = trpc.tracks.getById.query({ id: trackId })

  $: formattedCurrentTime = formatMilliseconds((currentTime || 0) * 1000)
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
      void player?.play()
    } else {
      player?.pause()
    }
  }

  const updateNowPlayingMutation = trpc.playback.updateNowPlaying.mutation()
  const { mutate: updateNowPlaying } = $updateNowPlayingMutation

  const scrobbleMutation = trpc.playback.scrobble.mutation()
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
</script>

<div class="flex items-center gap-4 rounded bg-black p-2">
  <div class="flex min-w-[180px] flex-[3] items-center gap-4">
    {#if $nowPlayingTrack.data}
      <div class="h-16 w-16 shrink-0">
        <CoverArt
          src={$nowPlayingTrack.data.hasCoverArt
            ? `/api/tracks/${trackId}/cover-art?width=128&height=128`
            : undefined}
          alt={$nowPlayingTrack.data.title}
          hoverable={false}
          placeholderClass="text-[8px]"
        />
      </div>

      <div class="overflow-hidden">
        <div class="truncate">
          {$nowPlayingTrack.data.title}
        </div>
        <div class="text-sm text-gray-400">
          {$nowPlayingTrack.data.artists
            .sort((a, b) => a.order - b.order)
            .map((artist) => artist.name)
            .join(', ')}
        </div>
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
          bind:value={currentTime}
          min={0}
          max={duration ?? 1}
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
  <div class="group flex flex-[2.25] items-center justify-end">
    <button
      type="button"
      class="center h-8 w-8 text-gray-400 hover:text-white"
      use:tooltip={{ content: $volume === 0 ? 'Unmute' : 'Mute' }}
      on:click={() => {
        if ($volume === 0) {
          $volume = previousVolume
        } else {
          previousVolume = $volume
          $volume = 0
        }
      }}
    >
      <div class="h-4 w-4">
        {#if $volume === 0}
          <VolumeOffIcon />
        {:else}
          <VolumeOnIcon />
        {/if}
      </div>
    </button>
    <div class="mr-4 w-[125px]">
      <Range bind:value={$volume} min={0} max={1} />
    </div>
  </div>
</div>

{#key __playSignal}
  <audio
    autoplay
    class="hidden"
    bind:this={player}
    bind:currentTime={$nowPlaying.currentTime}
    bind:duration={$nowPlaying.duration}
    bind:paused
    bind:volume={$volume}
    on:ended={() => nextTrack()}
  >
    <source src="/api/tracks/{trackId}/stream" type="audio/mpeg" />
  </audio>
{/key}
