<script lang="ts">
  import { getContextClient } from '$lib/trpc'

  import type { TrackDownload } from './types'

  export let download: TrackDownload

  const trpc = getContextClient()
  const importDownloadMutation = trpc.import.trackDownload.mutation()
  const handleImport = () =>
    $importDownloadMutation.mutate({ service: download.service, id: download.id })
</script>

<div class="contents">
  <div class="col-start-1" />
  <div>{download.name}</div>
  <div>
    {#if download.progress === 100}
      Complete
    {:else if download.progress !== null}
      Downloading... ({download.progress}%)
    {:else}
      Queued
    {/if}
  </div>
  {#if download.progress === 100}
    <button on:click={handleImport}>Import</button>
  {:else}
    <div />
  {/if}
</div>
