<script lang="ts">
  import { formatMilliseconds, isNotNull, uniq } from 'utils'

  import AddToPlaylistButton from '$lib/components/AddToPlaylistButton.svelte'
  import CoverArt from '$lib/components/CoverArt.svelte'
  import FavoriteButton from '$lib/components/FavoriteButton.svelte'
  import { makeCollageUrl, makeImageUrl } from '$lib/cover-art'
  import PlayIcon from '$lib/icons/PlayIcon.svelte'
  import { playTrack } from '$lib/now-playing'
  import { createPlaylistQuery } from '$lib/services/playlists'
  import { createFavoriteTrackMutation } from '$lib/services/tracks'
  import { getContextToast } from '$lib/toast/toast'
  import { getContextClient } from '$lib/trpc'

  import type { PageData } from './$types'

  export let data: PageData

  const trpc = getContextClient()
  const playlistQuery = createPlaylistQuery(trpc, data.id)

  $: favoriteMutation = createFavoriteTrackMutation(trpc, {
    getPlaylistQuery: { id: data.id },
  })

  const toast = getContextToast()
  function makeQueueData(trackIndex: number) {
    if (!$playlistQuery.data) {
      toast.warning('Could not queue additional tracks')
      return {
        previousTracks: [],
        nextTracks: [],
      }
    }

    return {
      previousTracks: $playlistQuery.data.tracks.slice(0, trackIndex).map((t) => t.track.id),
      nextTracks: $playlistQuery.data.tracks.slice(trackIndex + 1).map((t) => t.track.id),
    }
  }

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
</script>

{#if $playlistQuery.data}
  {@const playlist = $playlistQuery.data}
  {@const tracks = playlist.tracks}
  <div class="space-y-4 p-4">
    <div class="relative flex items-end gap-6">
      <button
        type="button"
        disabled={tracks.length === 0}
        on:click={() => playTrack(tracks[0].id, makeQueueData(0))}
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
        <h1 class="line-clamp-2 text-6xl font-bold leading-[1.19]" title={playlist.name}>
          {playlist.name}
        </h1>
      </div>
    </div>

    <div>
      {#each tracks as playlistTrack, i (playlistTrack.id)}
        {@const track = playlistTrack.track}
        <div
          class="group flex select-none items-center gap-2 rounded p-1.5 hover:bg-gray-700"
          on:dblclick={() => playTrack(track.id, makeQueueData(i))}
        >
          <button
            type="button"
            class="relative h-11 w-11 shadow"
            on:click={() => playTrack(track.id, makeQueueData(i))}
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
