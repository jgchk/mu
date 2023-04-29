<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { flip } from 'svelte/animate'

  import { dnd } from '$lib/actions/dnd'

  import type { TrackListTrack as TrackListTrackType } from './TrackList'
  import TrackListSort from './TrackListSort.svelte'
  import TrackListTrack from './TrackListTrack.svelte'

  type T = $$Generic<TrackListTrackType>

  export let tracks: T[]
  export let showCoverArt = true
  export let reorderable = false
  export let sortable = false

  let class_: string | undefined = undefined
  export { class_ as class }

  const dispatch = createEventDispatcher<{
    play: { track: T; i: number }
    favorite: { track: T; favorite: boolean }
    delete: { track: T }
    reorder: { tracks: T[] }
  }>()

  /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
  const play = (track: T, i: number) => dispatch('play', { track, i })
  const favorite = (track: T) => dispatch('favorite', { track, favorite: !track.favorite })
  const delete_ = (track: T) => dispatch('delete', { track })
  const reorder = (tracks: T[]) => dispatch('reorder', { tracks })

  $: showRelease = tracks.some((track) => track.release)
  $: showDelete = tracks.some((track) => track.playlistTrackId !== undefined)
  /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
</script>

<div class={class_}>
  {#if sortable}
    <TrackListSort {showRelease} {showCoverArt} {showDelete} />
  {/if}

  <div
    use:dnd={{ items: tracks, dragDisabled: !reorderable }}
    on:consider={(e) => {
      tracks = e.detail.items
    }}
    on:finalize={(e) => {
      tracks = e.detail.items
      reorder(e.detail.items)
    }}
  >
    {#each tracks as track, i (track.id)}
      <div animate:flip={{ duration: reorderable ? dnd.defaults.flipDurationMs : 0 }}>
        <TrackListTrack
          {track}
          {i}
          {showCoverArt}
          {showDelete}
          on:play={() => play(track, i)}
          on:favorite={() => favorite(track)}
          on:delete={() => delete_(track)}
        />
      </div>
    {/each}
  </div>

  <slot name="footer" />
</div>
