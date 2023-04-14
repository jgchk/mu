<script lang="ts">
  import { createAddArtistMutation, createAllArtistsQuery } from '$lib/services/artists'
  import { getContextClient } from '$lib/trpc'

  const trpc = getContextClient()
  const artistsQuery = createAllArtistsQuery(trpc)
  const addArtistMutation = createAddArtistMutation(trpc)

  let name = ''
  const handleAddArtist = () => {
    $addArtistMutation.mutate({ name })
    name = ''
  }
</script>

{#if $artistsQuery.data}
  <div>
    {#each $artistsQuery.data as artist}
      <a href="/artists/{artist.id}">
        {artist.name}
      </a>
    {/each}
  </div>

  <input type="text" bind:value={name} />
  <button type="button" on:click={handleAddArtist}>Add</button>
{:else if $artistsQuery.error}
  <div>{$artistsQuery.error.message}</div>
{:else}
  <div>Loading...</div>
{/if}
