<script lang="ts">
  import type { MediaPlayerClass, MediaPlayerFactory } from 'dashjs'
  import { createEventDispatcher, onDestroy, onMount } from 'svelte'
  import { raf } from 'svelte/internal'

  import { createDashManifestQuery } from '$lib/services/playback'

  console.log('rerender')

  let MediaPlayer: (() => MediaPlayerFactory) | undefined = undefined
  onMount(() => import('dashjs').then((res) => (MediaPlayer = res.MediaPlayer)))

  export let volume: number
  export let trackId: number
  export let paused = false
  export let loading = false
  export let playSignal: symbol | undefined

  let player_: HTMLAudioElement | undefined

  let dash: MediaPlayerClass | undefined = undefined
  $: if (player_ && MediaPlayer) {
    dash = MediaPlayer().create()
    dash.initialize(player_)
    dash.setAutoPlay(true)
  }

  $: manifestQuery = createDashManifestQuery(trackId)
  $: loading = $manifestQuery.isLoading
  $: loaded = $manifestQuery.isSuccess
  $: if (dash && loaded) {
    dash.attachSource(`/api/tracks/${trackId}/stream/dash`)
  }

  $: {
    playSignal // play from beginning of song every time playSignal changes
    seek(0)
    play()
  }

  $: if (loaded) {
    play()
  } else {
    pause()
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

    if (!dash?.isPaused()) {
      audioAnimationFrame = raf(handleTimeUpdate)
    }

    if (dash) {
      dispatch('timeupdate', dash.time())
    }
  }

  export function play() {
    dash?.play()
  }

  export function pause() {
    dash?.pause()
  }

  export function seek(time: number) {
    dash?.seek(time)
  }

  onDestroy(() => {
    pause()
    dash?.destroy()
  })

  $: if (dash) {
    dash.on('playbackEnded', () => dispatch('ended'))
    dash.on('playbackTimeUpdated', handleTimeUpdate)
  }
</script>

<audio
  autoplay
  class="hidden"
  bind:this={player_}
  bind:paused
  bind:volume
  on:durationchange={(e) => {
    const durationSec = e.currentTarget.duration
    if (durationSec !== Infinity) {
      dispatch('durationchange', durationSec)
    }
  }}
/>
