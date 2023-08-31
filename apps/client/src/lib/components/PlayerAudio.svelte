<script lang="ts">
  import { createEventDispatcher, onDestroy } from 'svelte'
  import { raf } from 'svelte/internal'

  export let volume: number
  export let trackId: number
  export let paused = false
  export let playSignal: symbol | undefined

  let player: HTMLAudioElement

  $: {
    playSignal
    if (player) {
      player.src = `/api/tracks/${trackId}/stream`
      player.load()
      void player.play()
    }
  }

  const dispatch = createEventDispatcher<{
    timeupdate: number
    durationchange: number
    ended: undefined
  }>()

  let audioAnimationFrame: number | void
  function handleTimeUpdate() {
    if (audioAnimationFrame !== void 0) {
      cancelAnimationFrame(audioAnimationFrame)
    }

    if (!paused) {
      audioAnimationFrame = raf(handleTimeUpdate)
    }

    if (player) {
      dispatch('timeupdate', player.currentTime)
    }
  }

  export async function play() {
    await player.play()
  }

  export function pause() {
    player.pause()
  }

  export function seek(time: number) {
    if (player) {
      player.currentTime = time
    }
  }

  onDestroy(() => {
    pause()
  })
</script>

<audio
  class="hidden"
  bind:this={player}
  bind:paused
  bind:volume
  on:ended={() => dispatch('ended')}
  on:timeupdate={() => handleTimeUpdate()}
  on:durationchange={(e) => {
    const durationSec = e.currentTarget.duration
    if (durationSec !== Infinity) {
      dispatch('durationchange', durationSec)
    }
  }}
/>
