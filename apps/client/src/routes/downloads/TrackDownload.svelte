<script lang="ts">
  import { getContextClient } from '$lib/trpc'

  import type { TrackDownload } from './types'

  export let download: TrackDownload

  const trpc = getContextClient()
  const importDownloadMutation = trpc.import.trackDownload.mutation()
  const handleImport = () => $importDownloadMutation.mutate({ id: download.id })
</script>

<div class="contents">
  <div />
  <div>{download.name}</div>
  <div>
    {#if download.complete}
      Complete
    {:else}
      Downloading...
    {/if}
  </div>
  {#if download.complete}
    <button on:click={handleImport}>Import</button>
  {:else}
    <div />
  {/if}
</div>
