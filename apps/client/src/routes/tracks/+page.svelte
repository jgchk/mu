<script lang="ts">
  import { inview } from 'svelte-inview'

  import Button from '$lib/atoms/Button.svelte'
  import CoverArt from '$lib/components/CoverArt.svelte'
  import FavoriteButton from '$lib/components/FavoriteButton.svelte'
  import PlayIcon from '$lib/icons/PlayIcon.svelte'
  import { playTrack } from '$lib/now-playing'
  import { getContextClient } from '$lib/trpc'
  import { formatMilliseconds } from '$lib/utils/date'

  import { tracksQueryInput } from './common'

  const trpc = getContextClient()
  let tracksQuery = trpc.tracks.getAllWithArtistsAndRelease.infiniteQuery(tracksQueryInput, {
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  })

  const favoriteMutation = trpc.tracks.favorite.mutation({
    onMutate: async (input) => {
      await trpc.tracks.getAllWithArtistsAndRelease.utils.cancel(tracksQueryInput)
      const previousData = trpc.tracks.getAllWithArtistsAndRelease.utils.getData(tracksQueryInput)
      trpc.tracks.getAllWithArtistsAndRelease.utils.setInfiniteData(tracksQueryInput, (old) => {
        if (!old) return old
        const newTracks = old.items.map((track) => {
          if (track.id === input.id) {
            return {
              ...track,
              favorite: input.favorite,
            }
          }
          return track
        })
        return { ...old, items: newTracks }
      })
      return { previousData }
    },
    onError: (err, input, context) => {
      trpc.tracks.getAllWithArtistsAndRelease.utils.setData(tracksQueryInput, context?.previousData)
    },
    onSuccess: async () => {
      await trpc.tracks.getAllWithArtistsAndRelease.utils.invalidate(tracksQueryInput)
    },
  })

  let inView = false
  $: {
    if (inView && $tracksQuery.hasNextPage && !$tracksQuery.isFetchingNextPage) {
      void $tracksQuery.fetchNextPage()
    }
  }
</script>

{#if $tracksQuery.data}
  {@const tracks = $tracksQuery.data.pages.flatMap((page) => page.items)}
  <div class="p-4">
    {#each tracks as track, i (track.id)}
      <div
        class="group flex select-none items-center gap-2 rounded p-1.5 hover:bg-gray-700"
        on:dblclick={() =>
          playTrack(track.id, {
            previousTracks: tracks.slice(0, i).map((t) => t.id),
            nextTracks: tracks.slice(i + 1).map((t) => t.id),
          })}
      >
        <button
          type="button"
          class="relative h-11 w-11 shadow"
          on:click={() =>
            playTrack(track.id, {
              previousTracks: tracks.slice(0, i).map((t) => t.id),
              nextTracks: tracks.slice(i + 1).map((t) => t.id),
            })}
        >
          <CoverArt
            src={track.hasCoverArt
              ? `/api/tracks/${track.id}/cover-art?width=80&height=80`
              : undefined}
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
        <div class="flex-[2] truncate text-sm text-gray-400">
          {#if track.release}
            <a class="hover:underline group-hover:text-white" href="/releases/{track.release.id}"
              >{#if track.release.title}
                {track.release.title}
              {:else}
                [untitled]
              {/if}
            </a>
          {/if}
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

    {#if $tracksQuery.hasNextPage}
      <div
        class="m-1 flex justify-center"
        use:inview
        on:inview_change={(event) => (inView = event.detail.inView)}
      >
        <Button kind="outline" on:click={() => $tracksQuery.fetchNextPage()}>
          {$tracksQuery.isFetchingNextPage ? 'Loading...' : 'Load More'}
        </Button>
      </div>
    {/if}
  </div>
{:else if $tracksQuery.error}
  <div>{$tracksQuery.error.message}</div>
{:else}
  <div>Loading...</div>
{/if}
