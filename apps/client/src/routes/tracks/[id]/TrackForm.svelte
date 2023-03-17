<script lang="ts">
  import type { RouterOutput } from '$lib/trpc'
  import { isDefined } from '$lib/utils/types'
  import { createEventDispatcher } from 'svelte'
  import ArtistSelect from './ArtistSelect.svelte'

  type Track = RouterOutput['tracks']['getById']

  export let track: Track

  let title = track.title
  let artists: (number | string | undefined)[] = track.artists.map((artist) => artist.id)

  const handleAddArtist = () => (artists = [...artists, undefined])

  const dispatch = createEventDispatcher<{
    submit: { title: string | null; artists: (number | string)[] }
  }>()
  const handleSubmit = () => dispatch('submit', { title, artists: artists.filter(isDefined) })
</script>

<form on:submit|preventDefault={handleSubmit}>
  <input type="text" bind:value={track.title} />

  <div>
    {#each artists as artist}
      <div>
        <ArtistSelect bind:value={artist} />
      </div>
    {/each}
    <button type="button" on:click={handleAddArtist}>Add Artist</button>
  </div>

  <button type="submit">Update</button>
</form>
