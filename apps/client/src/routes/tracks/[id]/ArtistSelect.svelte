<script lang="ts">
  import { getContextClient } from '$lib/trpc'

  const trpc = getContextClient()
  const artistsQuery = trpc.artists.getAll.query()

  export let value: string | number | undefined = undefined
  export let open = false

  export let filter = ''
  $: filteredArtists =
    filter.length > 0
      ? $artistsQuery.data?.filter((artist) =>
          artist.name.toLowerCase().includes(filter.toLowerCase())
        )
      : $artistsQuery.data

  let displayFilter = filter

  /**
   * Selected an artist (value is number):
   *   - Hit backspace -> remove character from displayValue, keep value same
   */

  /**
   * If input value is equal to artist name, show all results (filter = '')
   */

  $: {
    if (value === undefined) {
      displayFilter = ''
    } else if (typeof value === 'number') {
      if ($artistsQuery.data) {
        const artist = $artistsQuery.data.find((artist) => artist.id === value)
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
      displayFilter = value
    }
  }
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
      if (!filteredArtists || filteredArtists.length === 0) {
        value = displayFilter
      } else {
        value = filteredArtists[0].id
      }
      filter = ''
      open = false
    }
  }}
/>
{#if open}
  <div>
    {#if filteredArtists}
      {#if filteredArtists.length > 0}
        {#each filteredArtists as artist}
          <button type="button" class="block" on:click={() => (value = artist.id)}
            >{artist.name}</button
          >
        {/each}
      {:else}
        No artists found
      {/if}
    {:else if $artistsQuery.error}
      Error
    {:else}
      Loading...
    {/if}

    {#if displayFilter.length > 0}
      <button
        type="button"
        class="block"
        on:click={() => {
          value = displayFilter
          filter = ''
          open = false
        }}
      >
        Create new artist: {displayFilter}
      </button>
    {/if}
  </div>
{/if}

<div>Value: {value}</div>
