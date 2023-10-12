<script lang="ts">
  import { onDestroy } from 'svelte'
  import { raf } from 'svelte/internal'

  import { player } from '$lib/now-playing'

  import PlayerEvents from './PlayerEvents.svelte'

  let audio: HTMLAudioElement

  const playTrack = (trackId: number) => {
    audio.src = `/api/tracks/${trackId}/stream`
    audio.load()
    void audio.play()
  }

  let audioAnimationFrame: number | void
  function handleTimeUpdate() {
    if (audioAnimationFrame !== void 0) {
      cancelAnimationFrame(audioAnimationFrame)
    }

    if (!$player.paused) {
      audioAnimationFrame = raf(handleTimeUpdate)
    }

    if ($player.track) {
      $player.track.currentTimeMs = audio.currentTime * 1000
    }
  }

  onDestroy(() => {
    audio?.pause()
  })
</script>

<audio
  class="hidden"
  bind:this={audio}
  bind:paused={$player.paused}
  bind:volume={$player.volume}
  on:ended={() => player.nextTrack()}
  on:timeupdate={() => handleTimeUpdate()}
  on:durationchange={(e) => {
    const durationSec = e.currentTarget.duration
    if (durationSec !== Infinity && $player.track) {
      $player.track.durationMs = durationSec * 1000
    }
  }}
/>

<PlayerEvents
  on:playTrack={(e) => playTrack(e.detail.trackId)}
  on:nextTrack={(e) => playTrack(e.detail.trackId)}
  on:previousTrack={(e) => playTrack(e.detail.trackId)}
  on:play={() => void audio.play()}
  on:pause={() => audio.pause()}
  on:seek={(e) => (audio.currentTime = e.detail.time / 1000)}
/>
