<script lang="ts">
  import { getContextClient } from '$lib/trpc'

  const trpc = getContextClient()
  const artistsQuery = trpc.artists.getAll.query()
  const addArtistMutation = trpc.artists.add.mutation()

  let name = ''
  const handleAddArtist = () => {
    $addArtistMutation.mutate({ name })
    name = ''
  }
</script>

{#if $artistsQuery.data}
  <div>
    {#each $artistsQuery.data as artist}
      <div>
        {artist.name}
      </div>
    {/each}
  </div>

  <input type="text" bind:value={name} />
  <button type="button" on:click={handleAddArtist}>Add</button>
{:else if $artistsQuery.error}
  <div>{$artistsQuery.error.message}</div>
{:else}
  <div>Loading...</div>
{/if}
