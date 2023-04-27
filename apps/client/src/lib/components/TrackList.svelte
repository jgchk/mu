<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  import { tw } from '$lib/utils/classes'

  import type { Sort, TrackListTrack as TrackListTrackType } from './TrackList'
  import TrackListSort from './TrackListSort.svelte'
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

  export let sort: Sort | undefined = undefined
  $: showRelease = tracks.some((track) => track.release)
</script>

<div class={tw('grid', class_)} style:grid-template-columns="auto 1fr 1fr 1fr auto">
  <TrackListSort {sort} {showRelease} on:sort />

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
