<script lang="ts">
  import { getContextClient } from '$lib/trpc';

  import type { SoundcloudTrackDownload } from './types';

  export let download: SoundcloudTrackDownload;

  const trpc = getContextClient();
  const importDownloadMutation = trpc.import.scTrackDownload.mutation();
  const handleImport = () => $importDownloadMutation.mutate({ id: download.id });
</script>

<div class="contents">
  <div />
  <div>{download.name}</div>
  <div>
    {#if download.progress === 100}
      Complete
    {:else}
      Downloading...
    {/if}
  </div>
  {#if download.progress === 100}
    <button on:click={handleImport}>Import</button>
  {:else}
    <div />
  {/if}
</div>
