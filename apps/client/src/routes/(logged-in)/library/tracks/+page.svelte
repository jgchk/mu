<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import { inview } from 'svelte-inview'
  import { pipe } from 'utils'
  import { cn, toRelativeUrl, withUrlUpdate } from 'utils/browser'

  import Button from '$lib/atoms/Button.svelte'
  import InputGroup from '$lib/atoms/InputGroup.svelte'
  import Label from '$lib/atoms/Label.svelte'
  import EditTagsFilterPlaintext from '$lib/components/EditTagsFilterPlaintext.svelte'
  import FullscreenLoader from '$lib/components/FullscreenLoader.svelte'
  import TagSelect from '$lib/components/TagSelect.svelte'
  import TrackList from '$lib/components/TrackList.svelte'
  import { getContextDialogs } from '$lib/dialogs/dialogs'
  import { playTrack } from '$lib/now-playing'
  import { getContextClient } from '$lib/trpc'
  import type { RouterOutput } from '$lib/trpc'

  import type { PageData } from './$types'

  export let data: PageData

  const trpc = getContextClient()
  $: tracksQuery = trpc.tracks.getAll.infiniteQuery(data.query, {
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  })

  $: hasFilter = data.tags !== undefined
  $: hasAdvancedFilter = data.tags !== undefined && data.tags.parsed.kind !== 'id'

  let inView = false
  $: {
    if (inView && $tracksQuery.hasNextPage && !$tracksQuery.isFetchingNextPage) {
      void $tracksQuery.fetchNextPage()
    }
  }

  const makeQueueData = (
    tracks: RouterOutput['tracks']['getAll']['items'],
    trackIndex: number
  ) => ({
    previousTracks: tracks.slice(0, trackIndex).map((t) => t.id),
    nextTracks: tracks.slice(trackIndex + 1).map((t) => t.id),
  })

  const dialogs = getContextDialogs()
</script>

<div class="-mx-2 -mt-2">
  <div
    class={cn(
      'flex w-full gap-y-1 rounded bg-gray-900 p-1',
      hasFilter ? 'flex-col gap-x-8 md:flex-row' : 'flex-row gap-x-1'
    )}
  >
    <div class="flex flex-1 gap-1">
      {#if hasAdvancedFilter}
        <div
          class="flex min-w-[200px] max-w-[600px] flex-1 items-center rounded bg-gray-800 px-2 py-1"
        >
          <EditTagsFilterPlaintext filter={data.tags?.parsed} />
        </div>
      {:else}
        <InputGroup class="min-w-[200px] max-w-[600px] flex-1">
          <Label for="filter-tag" class="hidden">Tags Filter</Label>
          <TagSelect
            id="filter-tag"
            value={data.tags?.parsed.kind === 'id' ? data.tags.parsed.value : undefined}
            placeholder="Filter by tag..."
            class="w-full"
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

      {#if hasFilter}
        <Button
          kind="text"
          class="self-center"
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
    <div class="flex flex-nowrap gap-1 md:self-center">
      <Button
        class="order-1 md:order-2"
        kind={hasAdvancedFilter ? 'solid' : 'outline'}
        on:click={() => dialogs.open('edit-tags-filter', { filter: data.tags?.parsed })}
      >
        Advanced
      </Button>
      {#if data.tags !== undefined}
        {@const filter = data.tags.text}
        <Button
          kind="text"
          class="order-2 whitespace-nowrap md:order-1"
          on:click={() => dialogs.open('new-auto-playlist', { filter })}
          tooltip="Create a new auto-playlist with this filter"
        >
          New Auto-Playlist
        </Button>
      {/if}
    </div>
  </div>
</div>

{#if $tracksQuery.data}
  {@const tracks = $tracksQuery.data.pages.flatMap((page) => page.items)}
  <TrackList
    {tracks}
    favorites={data.query.favorite ?? false}
    sortable
    class="pt-2"
    on:play={(e) => playTrack(e.detail.track.id, makeQueueData(tracks, e.detail.i))}
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
  <FullscreenLoader />
{/if}
