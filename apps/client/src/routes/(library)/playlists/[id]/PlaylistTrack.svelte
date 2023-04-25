<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { formatMilliseconds } from 'utils'

  import IconButton from '$lib/atoms/IconButton.svelte'
  import AddToPlaylistButton from '$lib/components/AddToPlaylistButton.svelte'
  import CoverArt from '$lib/components/CoverArt.svelte'
  import FavoriteButton from '$lib/components/FavoriteButton.svelte'
  import { makeImageUrl } from '$lib/cover-art'
  import DeleteIcon from '$lib/icons/DeleteIcon.svelte'
  import PlayIcon from '$lib/icons/PlayIcon.svelte'
  import { createRemoveTrackFromPlaylistMutation } from '$lib/services/playlists'
  import { createFavoriteTrackMutation } from '$lib/services/tracks'
  import type { RouterOutput } from '$lib/trpc'
  import { getContextClient } from '$lib/trpc'

  export let track: RouterOutput['playlists']['tracks'][number]
  export let playlistId: number

  const trpc = getContextClient()
  $: favoriteMutation = createFavoriteTrackMutation(trpc, {
    getPlaylistTracksQuery: { id: playlistId },
  })

  const removeTrackMutation = createRemoveTrackFromPlaylistMutation(trpc)
  const handleRemoveTrack = (playlistTrackId: number) =>
    $removeTrackMutation.mutate({ playlistId, playlistTrackId })

  const dispatch = createEventDispatcher<{ play: undefined }>()
  const play = () => dispatch('play')
</script>

<div
  class="group flex select-none items-center gap-2 rounded p-1.5 hover:bg-gray-700"
  on:dblclick={play}
>
  <button type="button" class="relative h-11 w-11 shadow" on:click={play}>
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
    {#if track.playlistTrackId !== undefined}
      {@const playlistTrackId = track.playlistTrackId}
      <IconButton
        kind="text"
        layer={700}
        tooltip="Remove from playlist"
        on:click={() => handleRemoveTrack(playlistTrackId)}
        loading={$removeTrackMutation.isLoading}
      >
        <DeleteIcon />
      </IconButton>
    {/if}
  </div>
</div>
