<script lang="ts">
  import { onMount } from 'svelte'

  import { player } from '$lib/now-playing'

  import PlayerEvents from './PlayerEvents.svelte'

  onMount(() => {
    const handleMediaState = (e: AppEventMap['mediastate']) => {
      if (e.detail.type === 'cafe.jake.mu.PlayerState.Idle') {
        $player.paused = true
        $player.track = undefined
      } else {
        $player.paused = e.detail.state.type === 'cafe.jake.mu.MediaState.Paused'

        if (!$player.track || $player.track.id !== e.detail.trackId) {
          $player.track = {
            id: e.detail.trackId,
            currentTimeMs: e.detail.progress / 1000,
            durationMs: e.detail.duration,
            startTime: new Date(),
          }
        } else {
          $player.track.id = e.detail.trackId
          $player.track.currentTimeMs = e.detail.progress / 1000
          $player.track.durationMs = e.detail.duration
        }
      }
    }

    window.addEventListener('mediastate', handleMediaState)

    return () => {
      window.removeEventListener('mediastate', handleMediaState)
    }
  })
</script>

<PlayerEvents
  on:playTrack={(e) =>
    window.Android?.playTrack(
      e.detail.trackId,
      e.detail.previousTracks.toString(),
      e.detail.nextTracks.toString()
    )}
  on:nextTrack={() => window.Android?.nextTrack()}
  on:previousTrack={() => window.Android?.previousTrack()}
  on:play={() => window.Android?.play()}
  on:pause={() => window.Android?.pause()}
  on:seek={(e) => window.Android?.seek(e.detail.time * 1000)}
/>
