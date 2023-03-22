<script lang="ts">
  import { getContextClient } from '$lib/trpc';

  import ScTrackDownload from './ScTrackDownload.svelte';
  import type { SoundcloudPlaylistDownload, SoundcloudTrackDownload } from './types';

  export let download: SoundcloudPlaylistDownload & { tracks: SoundcloudTrackDownload[] };
  $: complete = download.tracks.every((track) => track.progress === 100);

  let expanded = false;

  const trpc = getContextClient();
  const importDownloadMutation = trpc.import.scPlaylistDownload.mutation();
  const handleImport = () => $importDownloadMutation.mutate({ id: download.id });
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
    <ScTrackDownload download={track} />
  {/each}
{/if}
