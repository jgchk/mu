<script lang="ts">
  import { getContextClient } from '$lib/trpc'
  import { sum } from '$lib/utils/math'

  import type {
    GroupDownload as GroupDownloadType,
    TrackDownload as TrackDownloadType,
  } from './types'

  export let download: GroupDownloadType & { tracks: TrackDownloadType[] }

  let status:
    | {
        type: 'complete' | 'queued'
      }
    | {
        type: 'downloading'
        progress: number
      } = { type: 'queued' }
  $: {
    if (download.tracks.every((track) => track.progress === 100)) {
      status = { type: 'complete' }
    } else if (download.tracks.every((track) => track.progress == null)) {
      status = { type: 'queued' }
    } else {
      const totalProgress = download.tracks.length * 100
      const currentProgress = sum(download.tracks.map((track) => track.progress ?? 0))
      status = {
        type: 'downloading',
        progress: Math.floor((currentProgress / totalProgress) * 100),
      }
    }
  }

  const trpc = getContextClient()
  const importDownloadMutation = trpc.import.groupDownload.mutation()
  const handleAutoImport = () => {
    $importDownloadMutation.mutate({ service: download.service, id: download.id })
  }
</script>

<div class="max-w-4xl rounded bg-gray-900 p-4 text-gray-200">
  <div class="files-grid items-center">
    <div class="contents">
      <div class="mb-2 truncate text-lg">{download.name ?? 'Loading...'}</div>
      <div class="mb-2 text-right text-lg">
        {#if status.type === 'complete'}
          <a
            class="hover:text-white"
            href="/downloads/{download.service}/group/{download.id}/import">Import</a
          >
          <button class="hover:text-white" on:click={handleAutoImport}>Auto-Import</button>
        {:else if status.type === 'downloading'}
          Downloading... ({status.progress}%)
        {:else}
          Queued
        {/if}
      </div>
    </div>
    {#each download.tracks as track (track.id)}
      <div class="contents text-gray-400">
        <div class="truncate">{track.name ?? 'Loading...'}</div>
        <div class="text-right">
          {#if track.progress === 100}
            Complete
          {:else if track.progress !== null}
            Downloading... ({track.progress}%)
          {:else}
            Queued
          {/if}
        </div>
      </div>
    {/each}
  </div>
</div>

<style lang="postcss">
  .files-grid {
    display: grid;
    grid-template-columns: auto 1fr;
    column-gap: theme(spacing.4);
  }
</style>
