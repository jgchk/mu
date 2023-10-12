<script lang="ts">
  import FullscreenLoader from '$lib/components/FullscreenLoader.svelte'
  import { getContextClient } from '$lib/trpc'

  import type { PageData } from './$types'
  import Playlist from './Playlist.svelte'

  export let data: PageData

  const trpc = getContextClient()
  $: playlistQuery = trpc.playlists.get.query({ id: data.id })
  $: tracksQuery = trpc.tracks.getByPlaylistId.query({
    playlistId: data.id,
    filter: data.tracksQuery,
  })

  $: playlist = $playlistQuery.data
  $: tracks = $tracksQuery.data
</script>

{#if playlist && tracks}
  <Playlist {playlist} {tracks} tracksQuery={data.tracksQuery} />
{:else if $playlistQuery.error || $tracksQuery.error}
  Error: {$playlistQuery.error?.message || $tracksQuery.error?.message}
{:else}
  <FullscreenLoader />
{/if}
