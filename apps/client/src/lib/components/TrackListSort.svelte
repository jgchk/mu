<script lang="ts">
  import { page } from '$app/stores'
  import { toRelativeUrl, withUrlUpdate } from 'utils/browser'

  import {
    TRACKS_SORT_COLUMN_PARAM,
    TRACKS_SORT_DIRECTION_PARAM,
    getTracksSort,
  } from '$lib/tracks-sort'
  import { cn } from '$lib/utils/classes'

  import type { Sort } from './TrackList'

  export let showRelease: boolean
  export let showCoverArt: boolean
  export let showDelete: boolean

  $: sort = getTracksSort($page.url)
  $: numButtons = 3 + (showDelete ? 1 : 0)

  $: withSortUpdate = (sort: Sort | undefined) =>
    toRelativeUrl(
      withUrlUpdate($page.url, (url) => {
        if (sort) {
          url.searchParams.set(TRACKS_SORT_COLUMN_PARAM, sort.column)
          url.searchParams.set(TRACKS_SORT_DIRECTION_PARAM, sort.direction)
        } else {
          url.searchParams.delete(TRACKS_SORT_COLUMN_PARAM)
          url.searchParams.delete(TRACKS_SORT_DIRECTION_PARAM)
        }
      })
    )
</script>

<div
  class={cn(
    'grid gap-2 p-1.5',
    showRelease
      ? 'grid-cols-[auto_6fr_auto] sm:grid-cols-[auto_6fr_4fr_1fr_auto]'
      : 'grid-cols-[auto_6fr_auto] sm:grid-cols-[auto_6fr_1fr_auto]'
  )}
>
  {#if showCoverArt}
    <div class="w-11" />
  {:else}
    <div class="w-8" />
  {/if}

  <div class="flex-1">
    <a
      data-sveltekit-keepfocus
      data-sveltekit-replacestate
      class="text-sm text-gray-400 transition hover:text-white"
      href={sort?.column === 'title'
        ? sort.direction === 'asc'
          ? withSortUpdate({ column: 'title', direction: 'desc' })
          : withSortUpdate({ column: 'artists', direction: 'asc' })
        : sort?.column === 'artists'
        ? sort.direction === 'asc'
          ? withSortUpdate({ column: 'artists', direction: 'desc' })
          : withSortUpdate(undefined)
        : withSortUpdate({ column: 'title', direction: 'asc' })}
      >{#if sort?.column === 'artists'}Artist{:else}Title{/if}{#if sort?.column === 'title' || sort?.column === 'artists'}{' '}<span
          class="text-primary-500">{sort.direction === 'asc' ? '▲' : '▼'}</span
        >{/if}</a
    >
  </div>

  {#if showRelease}
    <div class="hidden flex-1 sm:block">
      <a
        data-sveltekit-keepfocus
        data-sveltekit-replacestate
        class="text-sm text-gray-400 transition hover:text-white"
        href={sort?.column === 'release'
          ? sort.direction === 'asc'
            ? withSortUpdate({ column: 'release', direction: 'desc' })
            : withSortUpdate(undefined)
          : withSortUpdate({ column: 'release', direction: 'asc' })}
        >Release{#if sort?.column === 'release'}{' '}<span class="text-primary-500"
            >{sort.direction === 'asc' ? '▲' : '▼'}</span
          >{/if}</a
      >
    </div>
  {/if}

  <a
    data-sveltekit-keepfocus
    data-sveltekit-replacestate
    class="hidden justify-self-end whitespace-nowrap text-sm text-gray-400 transition hover:text-white sm:block"
    href={sort?.column === 'duration'
      ? sort.direction === 'asc'
        ? withSortUpdate({ column: 'duration', direction: 'desc' })
        : withSortUpdate(undefined)
      : withSortUpdate({ column: 'duration', direction: 'asc' })}
    >{#if sort?.column === 'duration'}<span class="text-primary-500"
        >{sort.direction === 'asc' ? '▲' : '▼'}</span
      >{' '}{/if}Length</a
  >

  <div style:width="{numButtons * 32 + (numButtons - 1) * 4}px" />
</div>
