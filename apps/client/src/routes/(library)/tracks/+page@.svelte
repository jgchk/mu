<script lang="ts">
  import { inview } from 'svelte-inview'
  import { pipe } from 'utils'
  import { toRelativeUrl, withUrlUpdate } from 'utils/browser'

  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import Button from '$lib/atoms/Button.svelte'
  import InputGroup from '$lib/atoms/InputGroup.svelte'
  import Label from '$lib/atoms/Label.svelte'
  import EditTagsFilterPlaintext from '$lib/components/EditTagsFilterPlaintext.svelte'
  import TagSelect from '$lib/components/TagSelect.svelte'
  import TrackList from '$lib/components/TrackList.svelte'
  import { getContextDialogs } from '$lib/dialogs/dialogs'
  import { playTrack } from '$lib/now-playing'
  import {
    createAllTracksWithArtistsAndReleaseQuery,
    createFavoriteTrackMutation,
  } from '$lib/services/tracks'
  import type { RouterOutput } from '$lib/trpc'
  import { getContextClient } from '$lib/trpc'

  import Layout from '../+layout.svelte'
  import FavoritesToggle from '../FavoritesToggle.svelte'
  import type { PageData } from './$types'

  export let data: PageData

  const trpc = getContextClient()
  $: tracksQuery = createAllTracksWithArtistsAndReleaseQuery(trpc, data.query)

  $: favoriteMutation = createFavoriteTrackMutation(trpc, {
    getAllTracksWithArtistsAndReleaseQuery: data.query,
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

  const dialogs = getContextDialogs()
</script>

<Layout>
  <svelte:fragment slot="sidebar">
    <FavoritesToggle />

    <div class="space-y-1 px-4">
      {#if data.tags === undefined || data.tags.parsed.kind === 'id'}
        <InputGroup>
          <Label for="filter-tag">Tags Filter</Label>
          <TagSelect
            id="filter-tag"
            value={data.tags?.parsed.kind === 'id' ? data.tags.parsed.value : undefined}
            on:change={({ detail: { value } }) => {
              const url = new URL($page.url)
              if (value === undefined) {
                url.searchParams.delete('tags')
              } else {
                url.searchParams.set('tags', value.toString())
              }
              void goto(url.toString(), { keepFocus: true, replaceState: true })
            }}
          />
        </InputGroup>
      {/if}

      <div class="flex gap-1">
        <Button
          kind="outline"
          on:click={() => dialogs.open('edit-tags-filter', { filter: data.tags?.parsed })}
        >
          Advanced
        </Button>
        {#if data.tags !== undefined}
          <Button
            kind="text"
            on:click={() => {
              const url = pipe(
                withUrlUpdate($page.url, (url) => {
                  url.searchParams.delete('tags')
                }),
                toRelativeUrl,
                decodeURIComponent
              )
              void goto(url, { keepFocus: true, replaceState: true })
            }}
          >
            Clear
          </Button>
        {/if}
      </div>
      {#if data.tags !== undefined}
        {@const filter = data.tags.text}
        <Button kind="outline" on:click={() => dialogs.open('new-auto-playlist', { filter })}>
          New Auto-Playlist
        </Button>
      {/if}
    </div>
  </svelte:fragment>

  {#if data.tags}
    <div class="rounded bg-gray-900 px-2 py-1">
      <EditTagsFilterPlaintext filter={data.tags.parsed} tagClass="text-gray-300" />
    </div>
  {/if}
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
