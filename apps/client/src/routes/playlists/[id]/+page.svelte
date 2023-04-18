<script lang="ts">
  import { formatMilliseconds } from 'utils'

  import FavoriteButton from '$lib/components/FavoriteButton.svelte'
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
  $: console.log($playlistQuery.data)

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
</script>

{#if $playlistQuery.data}
  {@const playlist = $playlistQuery.data}
  {@const tracks = playlist.tracks}
  <div class="space-y-4 p-4">
    <div class="relative flex items-end gap-6">
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
          <div class="center w-8">
            <div class="text-gray-400 group-hover:opacity-0">{i + 1}</div>
            <button
              type="button"
              class="hover:text-primary-500 absolute h-6 w-6 opacity-0 transition-colors group-hover:opacity-100"
              on:click={() => playTrack(track.id, makeQueueData(i))}
            >
              <PlayIcon />
            </button>
          </div>
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
          <FavoriteButton
            favorite={track.favorite}
            on:click={() => $favoriteMutation.mutate({ id: track.id, favorite: !track.favorite })}
          />
        </div>
      {/each}
    </div>
  </div>
{:else if $playlistQuery.error}
  Error: {$playlistQuery.error.message}
{:else}
  Loading...
{/if}
