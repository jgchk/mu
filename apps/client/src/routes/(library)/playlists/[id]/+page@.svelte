<script lang="ts">
  import { createPlaylistQuery, createPlaylistTracksQuery } from '$lib/services/playlists'
  import { getContextClient } from '$lib/trpc'

  import Layout from '../../+layout.svelte'
  import FavoritesToggle from '../../FavoritesToggle.svelte'
  import type { PageData } from './$types'
  import Playlist from './Playlist.svelte'

  export let data: PageData

  const trpc = getContextClient()
  $: playlistQuery = createPlaylistQuery(trpc, data.id)
  $: tracksQuery = createPlaylistTracksQuery(trpc, data.tracksQuery)
</script>

<Layout>
  <svelte:fragment slot="sidebar">
    <FavoritesToggle />
  </svelte:fragment>

  {#if $playlistQuery.data && $tracksQuery.data}
    <Playlist
      playlist={$playlistQuery.data}
      tracks={$tracksQuery.data}
      tracksQuery={data.tracksQuery}
    />
  {:else if $playlistQuery.error || $tracksQuery.error}
    Error: {$playlistQuery.error?.message || $tracksQuery.error?.message}
  {:else}
    Loading...
  {/if}
</Layout>
