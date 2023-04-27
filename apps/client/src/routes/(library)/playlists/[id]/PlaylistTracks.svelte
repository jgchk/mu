<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import type { DndEvent } from 'svelte-dnd-action'
  import { flip } from 'svelte/animate'

  import { dnd } from '$lib/actions/dnd'
  import TrackListTrack from '$lib/components/TrackListTrack.svelte'
  import {
    createEditPlaylistTrackOrderMutation,
    createRemoveTrackFromPlaylistMutation,
  } from '$lib/services/playlists'
  import { createFavoriteTrackMutation } from '$lib/services/tracks'
  import type { RouterInput, RouterOutput } from '$lib/trpc'
  import { getContextClient } from '$lib/trpc'

  export let tracks: RouterOutput['playlists']['tracks']
  export let playlistId: number
  export let tracksQuery: RouterInput['playlists']['tracks']
  export let reorderable: boolean

  const trpc = getContextClient()
  const editTrackOrderMutation = createEditPlaylistTrackOrderMutation(trpc)
  $: favoriteMutation = createFavoriteTrackMutation(trpc, {
    getPlaylistTracksQuery: tracksQuery,
  })

  const removeTrackMutation = createRemoveTrackFromPlaylistMutation(trpc)
  const handleRemoveTrack = (playlistTrackId: number) =>
    $removeTrackMutation.mutate({ playlistId, playlistTrackId })

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
        <TrackListTrack
          {track}
          {i}
          showDelete={track.playlistTrackId !== undefined}
          on:play={() => play(track.id, i)}
          on:favorite={() => $favoriteMutation.mutate({ id: track.id, favorite: !track.favorite })}
          on:delete={() =>
            track.playlistTrackId !== undefined && handleRemoveTrack(track.playlistTrackId)}
        />
      </div>
    {/each}
  </div>
{:else}
  <div>
    {#each tracks as track, i (track.id)}
      <div>
        <TrackListTrack
          {track}
          {i}
          showDelete={track.playlistTrackId !== undefined}
          on:play={() => play(track.id, i)}
          on:favorite={() => $favoriteMutation.mutate({ id: track.id, favorite: !track.favorite })}
          on:delete={() =>
            track.playlistTrackId !== undefined && handleRemoveTrack(track.playlistTrackId)}
        />
      </div>
    {/each}
  </div>
{/if}
