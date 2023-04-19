<script lang="ts">
  import { formatMilliseconds, isNotNull, uniq } from 'utils'

  import Button from '$lib/atoms/Button.svelte'
  import AddToPlaylistButton from '$lib/components/AddToPlaylistButton.svelte'
  import CoverArt from '$lib/components/CoverArt.svelte'
  import FavoriteButton from '$lib/components/FavoriteButton.svelte'
  import { makeCollageUrl, makeImageUrl } from '$lib/cover-art'
  import { getContextDialogs } from '$lib/dialogs/dialogs'
  import PlayIcon from '$lib/icons/PlayIcon.svelte'
  import { playTrack } from '$lib/now-playing'
  import { createPlaylistQuery } from '$lib/services/playlists'
  import { createFavoriteTrackMutation } from '$lib/services/tracks'
  import type { RouterOutput } from '$lib/trpc'
  import { getContextClient } from '$lib/trpc'

  import type { PageData } from './$types'

  export let data: PageData

  const trpc = getContextClient()
  $: playlistQuery = createPlaylistQuery(trpc, data.id)

  $: favoriteMutation = createFavoriteTrackMutation(trpc, {
    getPlaylistQuery: { id: data.id },
  })

  const makeQueueData = (
    playlist: RouterOutput['playlists']['getWithTracks'],
    trackIndex: number
  ) => ({
    previousTracks: playlist.tracks.slice(0, trackIndex).map((t) => t.trackId),
    nextTracks: playlist.tracks.slice(trackIndex + 1).map((t) => t.trackId),
  })

  function makePlaylistCollageUrl() {
    if (!$playlistQuery.data) {
      return undefined
    }

    const imageIds = $playlistQuery.data.tracks.map((t) => t.track.imageId).filter(isNotNull)
    if (imageIds.length === 0) {
      return undefined
    }

    const uniqueImageIds = uniq(imageIds)

    return makeCollageUrl(uniqueImageIds, { size: 512 })
  }

  const dialogs = getContextDialogs()
</script>

{#if $playlistQuery.data}
  {@const playlist = $playlistQuery.data}
  {@const tracks = playlist.tracks}

  <div class="space-y-4 p-4">
    <div class="relative flex items-end gap-6">
      <button
        type="button"
        disabled={tracks.length === 0}
        on:click={() => playTrack(tracks[0].trackId, makeQueueData(playlist, 0))}
      >
        <div class="relative w-64 shrink-0">
          <CoverArt
            src={playlist.imageId !== null
              ? makeImageUrl(playlist.imageId, { size: 512 })
              : makePlaylistCollageUrl()}
            alt={playlist.name}
            iconClass="w-16 h-16"
          >
            <PlayIcon />
          </CoverArt>
        </div>
      </button>

      <div class="space-y-1 pb-2">
        <h1
          class="mr-11 line-clamp-2 break-all text-6xl font-bold leading-[1.19]"
          title={playlist.name}
        >
          {playlist.name}
        </h1>
        {#if playlist.description}
          <h1 class="line-clamp-5 leading-[1.19] text-gray-400" title={playlist.description}>
            {playlist.description}
          </h1>
        {/if}
      </div>

      <Button
        kind="outline"
        class="absolute right-0 top-0"
        on:click={() => dialogs.open('edit-playlist', { playlistId: data.id })}
      >
        Edit
      </Button>
    </div>

    <div>
      {#each tracks as playlistTrack, i (playlistTrack.id)}
        {@const track = playlistTrack.track}
        <div
          class="group flex select-none items-center gap-2 rounded p-1.5 hover:bg-gray-700"
          on:dblclick={() => playTrack(track.id, makeQueueData(playlist, i))}
        >
          <button
            type="button"
            class="relative h-11 w-11 shadow"
            on:click={() => playTrack(track.id, makeQueueData(playlist, i))}
          >
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
            <AddToPlaylistButton trackId={track.id} layer={700} excludePlaylistId={data.id} />
          </div>
        </div>
      {/each}
    </div>
  </div>
{:else if $playlistQuery.error}
  Error: {$playlistQuery.error.message}
{:else}
  Loading...
{/if}
