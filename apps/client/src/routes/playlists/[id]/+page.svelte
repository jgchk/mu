<script lang="ts">
  import { createPlaylistQuery } from '$lib/services/playlists'
  import { getContextClient } from '$lib/trpc'

  import type { PageData } from './$types'
  import Playlist from './Playlist.svelte'

  export let data: PageData

  const trpc = getContextClient()
  $: playlistQuery = createPlaylistQuery(trpc, data.id)
</script>

{#if $playlistQuery.data}
  <Playlist playlist={$playlistQuery.data} />
{:else if $playlistQuery.error}
  Error: {$playlistQuery.error.message}
{:else}
  Loading...
{/if}
