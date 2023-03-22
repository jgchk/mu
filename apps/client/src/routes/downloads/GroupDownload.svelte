<script lang="ts">
  import { getContextClient } from '$lib/trpc'

  import TrackDownload from './TrackDownload.svelte'
  import type {
    GroupDownload as GroupDownloadType,
    TrackDownload as TrackDownloadType,
  } from './types'

  export let download: GroupDownloadType & { tracks: TrackDownloadType[] }
  $: complete = download.tracks.every((track) => track.progress === 100)

  let expanded = false

  const trpc = getContextClient()
  const importDownloadMutation = trpc.import.groupDownload.mutation()
  const handleImport = () => {
    if (download.service === 'soulseek') {
      $importDownloadMutation.mutate({
        service: download.service,
        ids: download.tracks.map((track) => track.id),
      })
    } else {
      $importDownloadMutation.mutate({ service: download.service, id: download.id })
    }
  }
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
