<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { flip } from 'svelte/animate'
  import type { DndEvent } from 'svelte-dnd-action'
  import { formatMilliseconds } from 'utils'

  import { dnd } from '$lib/actions/dnd'
  import AddToPlaylistButton from '$lib/components/AddToPlaylistButton.svelte'
  import CoverArt from '$lib/components/CoverArt.svelte'
  import FavoriteButton from '$lib/components/FavoriteButton.svelte'
  import { makeImageUrl } from '$lib/cover-art'
  import PlayIcon from '$lib/icons/PlayIcon.svelte'
  import { createEditPlaylistTrackOrderMutation } from '$lib/services/playlists'
  import { createFavoriteTrackMutation } from '$lib/services/tracks'
  import type { RouterOutput } from '$lib/trpc'
  import { getContextClient } from '$lib/trpc'

  export let tracks: RouterOutput['playlists']['getWithTracks']['tracks']
  export let playlistId: number

  const trpc = getContextClient()
  const editTrackOrderMutation = createEditPlaylistTrackOrderMutation(trpc)

  $: favoriteMutation = createFavoriteTrackMutation(trpc, {
    getPlaylistQuery: { id: playlistId },
  })

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
    {@const track = playlistTrack.track}
    <div
      class="group flex select-none items-center gap-2 rounded p-1.5 hover:bg-gray-700"
      on:dblclick={() => play(track.id, i)}
      animate:flip={{ duration: dnd.defaults.flipDurationMs }}
    >
      <button type="button" class="relative h-11 w-11 shadow" on:click={() => play(track.id, i)}>
        <CoverArt
          src={track.imageId !== null ? makeImageUrl(track.imageId, { size: 80 }) : undefined}
          alt={track.title}
          iconClass="w-5 h-5"
          placeholderClass="text-[5px]"
          rounding="rounded-sm"
        >
          <PlayIcon />
        </CoverArt>
      </button>
      <div class="flex-1 truncate">
        {track.title}
        <ul class="comma-list text-sm text-gray-400">
          {#each track.artists as artist (artist.id)}
            <li class="flex">
              <a class="hover:underline group-hover:text-white" href="/artists/{artist.id}"
                >{artist.name}</a
              >
            </li>
          {/each}
        </ul>
      </div>
      <div class="text-sm text-gray-400">
        {formatMilliseconds(track.duration)}
      </div>
      <div class="flex items-center gap-1">
        <FavoriteButton
          layer={700}
          favorite={track.favorite}
          on:click={() => $favoriteMutation.mutate({ id: track.id, favorite: !track.favorite })}
        />
        <AddToPlaylistButton trackId={track.id} layer={700} excludePlaylistId={playlistId} />
      </div>
    </div>
  {/each}
</div>
