<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  import { getContextClient } from '$lib/trpc'

  const trpc = getContextClient()
  const artistsQuery = trpc.artists.getAll.query()

  export let value:
    | {
        id: number
        action: 'connect'
      }
    | {
        id: number
        action: 'create'
      }
    | undefined = undefined
  export let artists: Map<number, string>
  export let open = false

  export let filter = ''
  $: filteredArtists = [
    ...((filter.length > 0
      ? $artistsQuery.data
          ?.filter((artist) => artist.name.toLowerCase().includes(filter.toLowerCase()))
          .map((artist) => ({ action: 'connect', ...artist } as const))
      : $artistsQuery.data?.map((artist) => ({ action: 'connect', ...artist } as const))) ?? []),
    ...(filter.length > 0
      ? [...artists.entries()]
          .filter(([, name]) => name.toLowerCase().includes(filter.toLowerCase()))
          .map(([id, name]) => ({ action: 'created', id, name } as const))
      : [...artists.entries()].map(([id, name]) => ({ action: 'created', id, name } as const))),
  ]

  let displayFilter = filter

  $: {
    if (value === undefined) {
      displayFilter = ''
    } else if (value.action === 'connect') {
      if ($artistsQuery.data) {
        const value_ = value
        const artist = $artistsQuery.data.find((artist) => artist.id === value_.id)
        if (artist) {
          displayFilter = artist.name
        } else {
          displayFilter = 'Unknown'
        }
      } else if ($artistsQuery.error) {
        displayFilter = 'Error'
      } else {
        displayFilter = 'Loading...'
      }
    } else {
      const name = artists.get(value.id)
      displayFilter = name ?? 'Unknown'
    }
  }

  const dispatch = createEventDispatcher<{ create: string; created: number; connect: number }>()
</script>

<input
  type="text"
  value={displayFilter}
  on:input={(e) => {
    filter = e.currentTarget.value
    displayFilter = e.currentTarget.value
  }}
  on:focus={() => (open = true)}
  on:blur={() => (open = false)}
  on:keydown={(e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredArtists.length === 0) {
        dispatch('create', displayFilter)
      } else {
        dispatch(filteredArtists[0].action, filteredArtists[0].id)
      }
      filter = ''
      open = false
    }
  }}
/>
{#if open}
  <div>
    {#if filteredArtists.length > 0}
      {#each filteredArtists as artist}
        <button
          type="button"
          class="block"
          on:click={() => {
            dispatch(artist.action, artist.id)
          }}>{artist.name}</button
        >
      {/each}
    {:else}
      No artists found
    {/if}

    {#if displayFilter.length > 0}
      <button
        type="button"
        class="block"
        on:click={() => {
          dispatch('create', displayFilter)
          filter = ''
          open = false
        }}
      >
        Create new artist: {displayFilter}
      </button>
    {/if}
  </div>
{/if}

<div>Value: {JSON.stringify(value)}</div>
