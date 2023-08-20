<script lang="ts">
  import FullscreenLoader from '$lib/components/FullscreenLoader.svelte'
  import TrackList from '$lib/components/TrackList.svelte'
  import { playTrack } from '$lib/now-playing'
  import { getContextClient } from '$lib/trpc'
  import type { RouterOutput } from '$lib/trpc'

  import type { PageData } from './$types'

  export let data: PageData

  const trpc = getContextClient()
  $: tracksQuery = trpc.tracks.search.query(
    { query: data.query },
    { enabled: data.query.length > 0 }
  )

  const makeQueueData = (tracks: RouterOutput['tracks']['search'], trackIndex: number) => ({
    previousTracks: tracks.slice(0, trackIndex).map((t) => t.id),
    nextTracks: tracks.slice(trackIndex + 1).map((t) => t.id),
  })
</script>

{#if data.hasQuery}
  {#if $tracksQuery.data}
    {@const tracks = $tracksQuery.data}
    <TrackList
      {tracks}
      on:play={(e) => playTrack(e.detail.track.id, makeQueueData(tracks, e.detail.i))}
    />
  {:else if $tracksQuery.error}
    <div>{$tracksQuery.error.message}</div>
  {:else}
    <FullscreenLoader />
  {/if}
{:else}
  <div>Enter a search query</div>
{/if}
