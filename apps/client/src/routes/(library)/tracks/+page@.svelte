<script lang="ts">
  import { inview } from 'svelte-inview'
  import { toRelativeUrl, withUrlUpdate } from 'utils/browser'

  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import Button from '$lib/atoms/Button.svelte'
  import Checkbox from '$lib/atoms/Checkbox.svelte'
  import InputGroup from '$lib/atoms/InputGroup.svelte'
  import Label from '$lib/atoms/Label.svelte'
  import TagSelect from '$lib/components/TagSelect.svelte'
  import TrackList from '$lib/components/TrackList.svelte'
  import { playTrack } from '$lib/now-playing'
  import {
    createAllTracksWithArtistsAndReleaseQuery,
    createFavoriteTrackMutation,
  } from '$lib/services/tracks'
  import type { RouterOutput } from '$lib/trpc'
  import { getContextClient } from '$lib/trpc'

  import Layout from '../+layout.svelte'
  import type { PageData } from './$types'
  import { makeTracksQueryInput } from './common'

  export let data: PageData

  $: tracksQueryInput = makeTracksQueryInput(data)

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
      data-sveltekit-keepfocus
      data-sveltekit-replacestate
      class="group/favorites flex h-10 w-full cursor-pointer items-center px-4"
      href={toRelativeUrl(
        withUrlUpdate($page.url, (url) => {
          if (data.favoritesOnly) {
            url.searchParams.delete('favorites')
          } else {
            url.searchParams.set('favorites', 'true')
          }
        })
      )}
      on:keydown={(e) => {
        // trigger link on space
        if (e.key === ' ') {
          e.preventDefault()
          e.stopPropagation()
          e.currentTarget.click()
        }
      }}
    >
      <InputGroup layout="horizontal" class="pointer-events-none">
        {#key data.favoritesOnly}
          <Checkbox id="filter-favorites-only" checked={data.favoritesOnly} tabindex={-1} />
        {/key}
        <Label
          for="filter-favorites-only"
          class="cursor-pointer transition group-hover/favorites:text-white">Favorites only</Label
        >
      </InputGroup>
    </a>

    <InputGroup class="px-4">
      <Label for="filter-tag">Tag</Label>
      <TagSelect
        id="filter-tag"
        value={data.tag}
        on:change={({ detail: { value } }) => {
          const url = new URL($page.url)
          if (value === undefined) {
            url.searchParams.delete('tag')
          } else {
            url.searchParams.set('tag', value.toString())
          }
          void goto(url.toString(), { keepFocus: true, replaceState: true })
        }}
      />
    </InputGroup>
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
