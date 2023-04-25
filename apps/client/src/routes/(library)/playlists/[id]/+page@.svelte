<script lang="ts">
  import { createPlaylistQuery } from '$lib/services/playlists'
  import { getContextClient } from '$lib/trpc'

  import Layout from '../../+layout.svelte'
  import FavoritesOnlyToggle from '../../FavoritesOnlyToggle.svelte'
  import type { PageData } from './$types'
  import Playlist from './Playlist.svelte'

  export let data: PageData

  const trpc = getContextClient()
  $: playlistQuery = createPlaylistQuery(trpc, data.id, data.query)
</script>

<Layout>
  <svelte:fragment slot="sidebar">
    <FavoritesOnlyToggle />
  </svelte:fragment>

  {#if $playlistQuery.data}
    <Playlist playlist={$playlistQuery.data} />
  {:else if $playlistQuery.error}
    Error: {$playlistQuery.error.message}
  {:else}
    Loading...
  {/if}
</Layout>
