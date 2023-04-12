<script lang="ts">
  import LinkButton from '$lib/atoms/LinkButton.svelte'
  import CoverArt from '$lib/components/CoverArt.svelte'
  import FavoriteButton from '$lib/components/FavoriteButton.svelte'
  import PlayIcon from '$lib/icons/PlayIcon.svelte'
  import { playTrack } from '$lib/now-playing'
  import { getContextToast } from '$lib/toast/toast'
  import { getContextClient } from '$lib/trpc'
  import { formatMilliseconds } from '$lib/utils/date'

  import type { PageData } from './$types'

  export let data: PageData

  const trpc = getContextClient()
  const releaseQuery = trpc.releases.getWithTracksAndArtists.query({ id: data.id })

  const favoriteMutation = trpc.tracks.favorite.mutation({
    onMutate: async (input) => {
      await trpc.releases.getWithTracksAndArtists.utils.cancel({ id: data.id })
      const previousData = trpc.releases.getWithTracksAndArtists.utils.getData({ id: data.id })
      trpc.releases.getWithTracksAndArtists.utils.setData({ id: data.id }, (old) => {
        if (!old) return old
        const newTracks = old.tracks.map((track) => {
          if (track.id === input.id) {
            return {
              ...track,
              favorite: input.favorite,
            }
          }
          return track
        })
        return {
          ...old,
          tracks: newTracks,
        }
      })
      return { previousData }
    },
    onError: (err, input, context) => {
      trpc.releases.getWithTracksAndArtists.utils.setData({ id: data.id }, context?.previousData)
    },
    onSuccess: async () => {
      await trpc.releases.getWithTracksAndArtists.utils.invalidate({ id: data.id })
    },
  })

  const toast = getContextToast()
  function makeQueueData(trackIndex: number) {
    if (!$releaseQuery.data) {
      toast.warning('Could not queue additional tracks')
      return {
        previousTracks: [],
        nextTracks: [],
      }
    }

    return {
      previousTracks: $releaseQuery.data.tracks.slice(0, trackIndex).map((t) => t.id),
      nextTracks: $releaseQuery.data.tracks.slice(trackIndex + 1).map((t) => t.id),
    }
  }
</script>

{#if $releaseQuery.data}
  {@const tracks = $releaseQuery.data.tracks}

  <div class="space-y-4 p-4">
    <div class="relative flex items-end gap-6">
      <button
        type="button"
        disabled={tracks.length === 0}
        on:click={() => playTrack(tracks[0].id, makeQueueData(0))}
      >
        <div class="relative w-64 shrink-0">
          <CoverArt
            src={$releaseQuery.data.hasCoverArt
              ? `/api/releases/${$releaseQuery.data.id}/cover-art?width=512&height=512`
              : undefined}
            alt={$releaseQuery.data.title}
            iconClass="w-16 h-16"
          >
            <PlayIcon />
          </CoverArt>
        </div>
      </button>

      <div class="space-y-1 pb-2">
        <h1 class="line-clamp-2 text-6xl font-bold leading-[1.19]" title={$releaseQuery.data.title}>
          {$releaseQuery.data.title}
        </h1>
        <ul class="comma-list text-sm font-bold">
          {#each $releaseQuery.data.artists as artist (artist.id)}
            <li class="flex">
              <a class="hover:underline group-hover:text-white" href="/artists/{artist.id}"
                >{artist.name}</a
              >
            </li>
          {/each}
        </ul>
      </div>

      <LinkButton
        href="/releases/{$releaseQuery.data.id}/edit"
        kind="outline"
        class="absolute right-0 top-0">Edit</LinkButton
      >
    </div>

    <div>
      {#each tracks as track, i (track.id)}
        <div
          class="group flex select-none items-center gap-2 rounded p-1.5 hover:bg-gray-700"
          on:dblclick={() => playTrack(track.id, makeQueueData(i))}
        >
          <div class="center w-8">
            <div class="text-gray-400 group-hover:opacity-0">{track.trackNumber}</div>
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
{:else if $releaseQuery.error}
  <div>{$releaseQuery.error.message}</div>
{:else}
  <div>Loading...</div>
{/if}
