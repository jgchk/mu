<script lang="ts">
  import type { RouterOutput } from '$lib/trpc'
  import { createEventDispatcher } from 'svelte'

  type Track = RouterOutput['tracks']['getById']

  export let track: Track

  const dispatch = createEventDispatcher<{ submit: Track }>()
  const handleSubmit = () => dispatch('submit', track)
</script>

<form on:submit|preventDefault={handleSubmit}>
  <input type="text" bind:value={track.title} />
  <button type="submit">Update</button>
</form>
