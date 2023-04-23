<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  import type { TrackListTrack as TrackListTrackType } from './TrackList'
  import TrackListTrack from './TrackListTrack.svelte'

  export let tracks: TrackListTrackType[]
  export let showCoverArt = true
  let class_: string | undefined = undefined
  export { class_ as class }

  const dispatch = createEventDispatcher<{
    play: { track: TrackListTrackType; i: number }
    favorite: { track: TrackListTrackType; favorite: boolean }
  }>()
  const play = (track: TrackListTrackType, i: number) => dispatch('play', { track, i })
  const favorite = (track: TrackListTrackType) =>
    dispatch('favorite', { track, favorite: !track.favorite })
</script>

<div class={class_}>
  {#each tracks as track, i (track.id)}
    <TrackListTrack
      {track}
      {i}
      {showCoverArt}
      on:play={() => play(track, i)}
      on:favorite={() => favorite(track)}
    />
  {/each}

  <slot name="footer" />
</div>
