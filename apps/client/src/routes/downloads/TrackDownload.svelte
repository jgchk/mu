<script lang="ts">
  import { getContextClient } from '$lib/trpc'

  import type { TrackDownload } from './types'

  export let download: TrackDownload

  const trpc = getContextClient()
  const importDownloadMutation = trpc.import.trackDownload.mutation()
  const handleAutoImport = () => {
    $importDownloadMutation.mutate({ service: download.service, id: download.id })
  }
</script>

<div class="max-w-4xl rounded bg-gray-900 p-4 text-gray-200">
  <div class="files-grid items-center">
    <div class="truncate text-lg">{download.name ?? 'Loading...'}</div>
    <div class="text-right text-lg">
      {#if download.progress === 100}
        <a class="hover:text-white" href="/downloads/{download.service}/track/{download.id}/import"
          >Import</a
        >
        <button class="hover:text-white" on:click={handleAutoImport}>Auto-Import</button>
      {:else if download.progress !== null}
        Downloading... ({download.progress}%)
      {:else}
        Queued
      {/if}
    </div>
  </div>
</div>

<style lang="postcss">
  .files-grid {
    display: grid;
    grid-template-columns: auto 1fr;
    column-gap: theme(spacing.4);
  }
</style>
