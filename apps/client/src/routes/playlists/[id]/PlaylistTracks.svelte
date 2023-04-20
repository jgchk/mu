<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { flip } from 'svelte/animate'
  import type { DndEvent } from 'svelte-dnd-action'

  import { dnd } from '$lib/actions/dnd'
  import { createEditPlaylistTrackOrderMutation } from '$lib/services/playlists'
  import type { RouterOutput } from '$lib/trpc'
  import { getContextClient } from '$lib/trpc'

  import PlaylistTrack from './PlaylistTrack.svelte'

  export let tracks: RouterOutput['playlists']['getWithTracks']['tracks']
  export let playlistId: number

  const trpc = getContextClient()
  const editTrackOrderMutation = createEditPlaylistTrackOrderMutation(trpc)

  const handleConsiderReorder = (
    e: CustomEvent<DndEvent<RouterOutput['playlists']['getWithTracks']['tracks'][number]>> & {
      target: EventTarget & HTMLDivElement
    }
  ) => {
    tracks = e.detail.items
  }

  const handleReorderTracks = (
    e: CustomEvent<DndEvent<RouterOutput['playlists']['getWithTracks']['tracks'][number]>> & {
      target: EventTarget & HTMLDivElement
    }
  ) => {
    const previousTracks = [...tracks]
    tracks = e.detail.items
    $editTrackOrderMutation.mutate(
      {
        playlistId: playlistId,
        playlistTrackIds: e.detail.items.map((track) => track.id),
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

<div
  use:dnd={{ items: tracks, dragDisabled: $editTrackOrderMutation.isLoading }}
  on:consider={handleConsiderReorder}
  on:finalize={handleReorderTracks}
>
  {#each tracks as playlistTrack, i (playlistTrack.id)}
    <div animate:flip={{ duration: dnd.defaults.flipDurationMs }}>
      <PlaylistTrack {playlistTrack} on:play={() => play(playlistTrack.track.id, i)} />
    </div>
  {/each}
</div>
