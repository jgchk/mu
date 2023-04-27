<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  import type { Sort } from './TrackList'

  export let sort: Sort | undefined = undefined
  export let showRelease: boolean
  export let showCoverArt: boolean
  export let showDelete: boolean

  const dispatch = createEventDispatcher<{ sort: { sort: Sort | undefined } }>()
  const setSort = (sort: Sort | undefined) => dispatch('sort', { sort })

  $: numButtons = 3 + (showDelete ? 1 : 0)
</script>

<div class="flex gap-2 p-1.5">
  {#if showCoverArt}
    <div class="w-11" />
  {:else}
    <div class="w-8" />
  {/if}
  <div class="flex-1">
    <button
      type="button"
      class="text-sm text-gray-400 transition hover:text-white"
      on:click={() => {
        if (sort?.column === 'title') {
          if (sort.direction === 'asc') {
            setSort({ column: 'title', direction: 'desc' })
          } else {
            setSort({ column: 'artists', direction: 'asc' })
          }
        } else if (sort?.column === 'artists') {
          if (sort.direction === 'asc') {
            setSort({ column: 'artists', direction: 'desc' })
          } else {
            setSort(undefined)
          }
        } else {
          setSort({ column: 'title', direction: 'asc' })
        }
      }}
    >
      {#if sort?.column === 'artists'}Artist{:else}Title{/if}{#if sort?.column === 'title' || sort?.column === 'artists'}{' '}<span
          class="text-primary-500">{sort.direction === 'asc' ? '▲' : '▼'}</span
        >{/if}
    </button>
  </div>
  <div class="flex-[2]">
    {#if showRelease}
      <button
        type="button"
        class="text-sm text-gray-400 transition hover:text-white"
        on:click={() => {
          if (sort?.column === 'release') {
            if (sort.direction === 'asc') {
              setSort({ column: 'release', direction: 'desc' })
            } else {
              setSort(undefined)
            }
          } else {
            setSort({ column: 'release', direction: 'asc' })
          }
        }}
      >
        Release{#if sort?.column === 'release'}{' '}<span class="text-primary-500"
            >{sort.direction === 'asc' ? '▲' : '▼'}</span
          >{/if}
      </button>
    {/if}
  </div>
  <div class="flex-1">
    <button
      type="button"
      class="float-right text-sm text-gray-400 transition hover:text-white"
      on:click={() => {
        if (sort?.column === 'duration') {
          if (sort.direction === 'asc') {
            setSort({ column: 'duration', direction: 'desc' })
          } else {
            setSort(undefined)
          }
        } else {
          setSort({ column: 'duration', direction: 'asc' })
        }
      }}
    >
      {#if sort?.column === 'duration'}<span class="text-primary-500"
          >{sort.direction === 'asc' ? '▲' : '▼'}</span
        >{' '}{/if}Length
    </button>
  </div>
  <div style:width="{numButtons * 32 + (numButtons - 1) * 4}px" />
</div>
