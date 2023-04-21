<script lang="ts">
  import { inview } from 'svelte-inview'

  import Button from '$lib/atoms/Button.svelte'
  import TrackList from '$lib/components/TrackList.svelte'
  import { playTrack } from '$lib/now-playing'
  import {
    createAllTracksWithArtistsAndReleaseQuery,
    createFavoriteTrackMutation,
  } from '$lib/services/tracks'
  import type { RouterOutput } from '$lib/trpc'
  import { getContextClient } from '$lib/trpc'
  import { cn } from '$lib/utils/classes'

  import Layout from '../+layout.svelte'
  import type { PageData } from './$types'
  import { makeTracksQueryInput } from './common'

  export let data: PageData

  $: tracksQueryInput = makeTracksQueryInput(data.favoritesOnly)

  const trpc = getContextClient()
  $: tracksQuery = createAllTracksWithArtistsAndReleaseQuery(trpc, tracksQueryInput)

  $: favoriteMutation = createFavoriteTrackMutation(trpc, {
    getAllTracksWithArtistsAndReleaseQuery: tracksQueryInput,
  })

  let inView = false
  $: {
    if (inView && $tracksQuery.hasNextPage && !$tracksQuery.isFetchingNextPage) {
      void $tracksQuery.fetchNextPage()
    }
  }

  const makeQueueData = (
    tracks: RouterOutput['tracks']['getAllWithArtistsAndRelease']['items'],
    trackIndex: number
  ) => ({
    previousTracks: tracks.slice(0, trackIndex).map((t) => t.id),
    nextTracks: tracks.slice(trackIndex + 1).map((t) => t.id),
  })
</script>

<Layout>
  <svelte:fragment slot="sidebar">
    <a
      href={data.favoritesOnly ? '/tracks' : '/tracks?favorites=true'}
      class={cn(
        'flex h-10 w-full items-center px-4 hover:text-white',
        data.favoritesOnly ? 'text-white' : 'text-gray-500'
      )}
    >
      Favorites
    </a>
  </svelte:fragment>

  {#if $tracksQuery.data}
    {@const tracks = $tracksQuery.data.pages.flatMap((page) => page.items)}
    <TrackList
      {tracks}
      class="p-4"
      on:play={(e) => playTrack(e.detail.track.id, makeQueueData(tracks, e.detail.i))}
      on:favorite={(e) =>
        $favoriteMutation.mutate({ id: e.detail.track.id, favorite: e.detail.favorite })}
    >
      <svelte:fragment slot="footer">
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
      </svelte:fragment>
    </TrackList>
  {:else if $tracksQuery.error}
    <div>{$tracksQuery.error.message}</div>
  {:else}
    <div>Loading...</div>
  {/if}
</Layout>
