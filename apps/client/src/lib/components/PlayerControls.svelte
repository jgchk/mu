<script lang="ts">
  import { formatMilliseconds } from 'utils'

  import { TooltipDefaults, tooltip } from '$lib/actions/tooltip'
  import Range from '$lib/atoms/Range.svelte'
  import FastForwardIcon from '$lib/icons/FastForwardIcon.svelte'
  import PauseIcon from '$lib/icons/PauseIcon.svelte'
  import PlayIcon from '$lib/icons/PlayIcon.svelte'
  import RewindIcon from '$lib/icons/RewindIcon.svelte'
  import { player } from '$lib/now-playing'
  import type { PlayerState } from '$lib/now-playing'

  export let track: NonNullable<PlayerState['track']>

  $: durationMs = $player.track?.durationMs
  $: formattedDuration = formatMilliseconds(durationMs ?? 0)

  $: formattedCurrentTime = formatMilliseconds(track.currentTimeMs ?? 0)
  $: timeMinWidth = `${Math.max(formattedCurrentTime.length, formattedDuration.length) * 7}px`

  const togglePlaying = () => {
    if ($player.paused) {
      player.play()
    } else {
      player.pause()
    }
  }
</script>

<div class="w-fit max-w-[722px] md:w-[40%]">
  <div class="flex w-full items-center justify-center gap-3.5">
    <button
      type="button"
      class="md:center hidden h-8 w-8 text-gray-400 transition hover:text-white"
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
      class="md:center hidden h-8 w-8 text-gray-400 transition hover:text-white"
      use:tooltip={{ content: 'Next', delay: [2000, TooltipDefaults.delay] }}
      on:click={() => player.nextTrack()}
    >
      <FastForwardIcon class="h-6 w-6" />
    </button>
  </div>
  <div
    class="absolute inset-x-2 -bottom-2 flex items-center gap-2 md:relative md:inset-x-[unset] md:bottom-[unset]"
  >
    <div class="hidden text-right text-xs text-gray-400 md:block" style:min-width={timeMinWidth}>
      {formattedCurrentTime}
    </div>
    <div class="flex-1">
      <Range
        bind:value={track.currentTimeMs}
        min={0}
        max={durationMs ?? 1000}
        height="h-[3px]"
        on:change={(e) => player.seek(e.detail)}
      />
    </div>
    <div class="hidden text-xs text-gray-400 md:block" style:min-width={timeMinWidth}>
      {formattedDuration}
    </div>
  </div>
</div>
