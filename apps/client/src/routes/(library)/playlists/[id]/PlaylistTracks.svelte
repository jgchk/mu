<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { flip } from 'svelte/animate'
  import type { DndEvent } from 'svelte-dnd-action'

  import { dnd } from '$lib/actions/dnd'
  import { createEditPlaylistTrackOrderMutation } from '$lib/services/playlists'
  import type { RouterInput, RouterOutput } from '$lib/trpc'
  import { getContextClient } from '$lib/trpc'

  import PlaylistTrack from './PlaylistTrack.svelte'

  export let tracks: RouterOutput['playlists']['tracks']
  export let playlistId: number
  export let tracksQuery: RouterInput['playlists']['tracks']
  export let reorderable: boolean

  const trpc = getContextClient()
  const editTrackOrderMutation = createEditPlaylistTrackOrderMutation(trpc)

  const handleConsiderReorder = (
    e: CustomEvent<DndEvent<RouterOutput['playlists']['tracks'][number]>> & {
      target: EventTarget & HTMLDivElement
    }
  ) => {
    tracks = e.detail.items
  }

  const handleReorderTracks = (
    e: CustomEvent<DndEvent<RouterOutput['playlists']['tracks'][number]>> & {
      target: EventTarget & HTMLDivElement
    }
  ) => {
    const previousTracks = [...tracks]
    tracks = e.detail.items
    $editTrackOrderMutation.mutate(
      {
        playlistId: playlistId,
        trackIds: e.detail.items.map((t) => t.id),
      },
      {
        onError: () => {
          tracks = previousTracks
        },
      }
    )
  }

  const dispatch = createEventDispatcher<{ play: { id: number; index: number } }>()
  const play = (id: number, index: number) => dispatch('play', { id, index })
</script>

{#if reorderable}
  <div
    use:dnd={{ items: tracks, dragDisabled: $editTrackOrderMutation.isLoading }}
    on:consider={handleConsiderReorder}
    on:finalize={handleReorderTracks}
  >
    {#each tracks as track, i (track.id)}
      <div animate:flip={{ duration: dnd.defaults.flipDurationMs }}>
        <PlaylistTrack {track} {playlistId} {tracksQuery} on:play={() => play(track.id, i)} />
      </div>
    {/each}
  </div>
{:else}
  <div>
    {#each tracks as track, i (track.id)}
      <div>
        <PlaylistTrack {track} {playlistId} {tracksQuery} on:play={() => play(track.id, i)} />
      </div>
    {/each}
  </div>
{/if}
