<script lang="ts">
  import { getContextClient } from '$lib/trpc'

  import TrackDownload from './TrackDownload.svelte'
  import type { ReleaseDownload, TrackDownload as TrackDownloadType } from './types'

  export let download: ReleaseDownload & { tracks: TrackDownloadType[] }
  $: complete = download.tracks.every((track) => track.complete)

  let expanded = false

  const trpc = getContextClient()
  const importDownloadMutation = trpc.import.releaseDownload.mutation()
  const handleImport = () => $importDownloadMutation.mutate({ id: download.id })
</script>

<div class="contents">
  <button on:click={() => (expanded = !expanded)}>
    {expanded ? '^' : 'v'}
  </button>
  <div>{download.name}</div>
  <div>
    {#if complete}
      Complete
    {:else}
      Downloading...
    {/if}
  </div>
  {#if complete}
    <button on:click={handleImport}>Import</button>
  {:else}
    <div />
  {/if}
</div>

{#if expanded}
  {#each download.tracks as track (track.id)}
    <TrackDownload download={track} />
  {/each}
{/if}
