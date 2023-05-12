<script lang="ts">
  import FullscreenLoader from '$lib/components/FullscreenLoader.svelte'
  import { createPlaylistQuery, createPlaylistTracksQuery } from '$lib/services/playlists'
  import { getContextClient } from '$lib/trpc'

  import type { PageData } from './$types'
  import Playlist from './Playlist.svelte'

  export let data: PageData

  const trpc = getContextClient()
  $: playlistQuery = createPlaylistQuery(trpc, data.id)
  $: tracksQuery = createPlaylistTracksQuery(trpc, data.tracksQuery)
</script>

{#if $playlistQuery.data && $tracksQuery.data}
  <Playlist
    playlist={$playlistQuery.data}
    tracks={$tracksQuery.data}
    tracksQuery={data.tracksQuery}
  />
{:else if $playlistQuery.error || $tracksQuery.error}
  Error: {$playlistQuery.error?.message || $tracksQuery.error?.message}
{:else}
  <FullscreenLoader />
{/if}
