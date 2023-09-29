<script lang="ts">
  import { goto } from '$app/navigation'
  import { distance } from 'fastest-levenshtein'

  import SearchBar from '$lib/components/SearchBar.svelte'
  import { getContextClient } from '$lib/trpc'

  import { NUM_TRACKS } from '../library/all/common'
  import type { PageData } from './$types'
  import SearchKindButton from './SearchKindButton.svelte'
  import SearchResult from './SearchResult.svelte'
  import type { SearchResult as SearchResultType } from './model'
  import { getTitle } from './model'

  export let data: PageData

  const trpc = getContextClient()
  $: tracksQuery = trpc.tracks.getAll.query(
    { title: data.searchQuery, limit: NUM_TRACKS },
    { enabled: !!data.searchQuery?.length }
  )
  $: releasesQuery = trpc.releases.getAll.query(
    { title: data.searchQuery },
    { enabled: !!data.searchQuery?.length }
  )
  $: artistsQuery = trpc.artists.getAll.query(
    { name: data.searchQuery },
    { enabled: !!data.searchQuery?.length }
  )
  $: playlistsQuery = trpc.playlists.getAll.query(
    { name: data.searchQuery },
    { enabled: !!data.searchQuery?.length }
  )
  $: tagsQuery = trpc.tags.getAll.query(
    { name: data.searchQuery },
    { enabled: !!data.searchQuery?.length }
  )

  let results: SearchResultType[] | undefined
  $: {
    if (!data.searchQuery?.length) {
      results = []
    } else if (
      $tracksQuery.data &&
      $releasesQuery.data &&
      $artistsQuery.data &&
      $playlistsQuery.data &&
      $tagsQuery.data
    ) {
      results = []
      if (kind === 'track' || kind === undefined) {
        results.push(...$tracksQuery.data.items.map((i) => ({ ...i, kind: 'track' } as const)))
      }
      if (kind === 'release' || kind === undefined) {
        results.push(...$releasesQuery.data.map((i) => ({ ...i, kind: 'release' } as const)))
      }
      if (kind === 'artist' || kind === undefined) {
        results.push(...$artistsQuery.data.map((i) => ({ ...i, kind: 'artist' } as const)))
      }
      if (kind === 'playlist' || kind === undefined) {
        results.push(...$playlistsQuery.data.map((i) => ({ ...i, kind: 'playlist' } as const)))
      }
      if (kind === 'tag' || kind === undefined) {
        results.push(...$tagsQuery.data.map((i) => ({ ...i, kind: 'tag' } as const)))
      }

      if (data.searchQuery) {
        const searchQuery = data.searchQuery.toLowerCase()
        results = results.sort((a, b) => {
          const aDist = distance(getTitle(a).toLowerCase(), searchQuery)
          const bDist = distance(getTitle(b).toLowerCase(), searchQuery)
          return aDist - bDist
        })
      }
    } else {
      results = undefined
    }
  }

  let kind: SearchResultType['kind'] | undefined = undefined
  const kinds: SearchResultType['kind'][] = ['track', 'release', 'artist', 'playlist', 'tag']
</script>

<SearchBar
  layer={800}
  autofocus
  initialQuery={data.searchQuery}
  on:input={(e) => {
    if (e.detail.length > 0) {
      void goto(`/search?q=${e.detail}`)
    } else {
      void goto('/search')
    }
  }}
/>

<div class="my-2 flex gap-1 overflow-x-auto">
  <SearchKindButton kind="top" selected={kind === undefined} on:click={() => (kind = undefined)} />
  {#each kinds as k (k)}
    <SearchKindButton kind={k + 's'} selected={kind === k} on:click={() => (kind = k)} />
  {/each}
</div>

{#if results}
  {#each results as result (`${result.kind}-${result.id}`)}
    <SearchResult {result} />
  {/each}
{/if}
