<script lang="ts">
  import { tooltip } from '$lib/actions/tooltip'
  import LinkButton from '$lib/atoms/LinkButton.svelte'
  import { getTimeSinceShort, toPrettyDate } from '$lib/utils/date'
  import { toErrorString } from '$lib/utils/error'
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
</script>

<div class="max-w-4xl rounded bg-gray-900 p-4 text-gray-200">
  <div class="files-grid items-center">
    <div class="contents">
      <div class="mb-2 truncate text-lg">{download.name ?? 'Loading...'}</div>
      <div class="mb-2 flex justify-end">
        {#if status.type === 'complete'}
          <LinkButton
            kind="outline"
            href="/downloads/{download.service}/group/{download.id}/import"
          >
            Import
          </LinkButton>
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
          {#if track.status === 'done'}
            Complete
          {:else if track.status === 'downloading'}
            Downloading...{#if track.progress !== null} ({track.progress}%){/if}
          {:else if track.status === 'error'}
            <span
              class="text-error-500"
              use:tooltip={{
                content: track.error !== undefined ? toErrorString(track.error) : 'Unknown error',
              }}
            >
              Error
            </span>
          {:else}
            Queued
          {/if}
        </div>
      </div>
    {/each}
  </div>
  <div class="mt-3 flex items-center gap-4 text-sm">
    <div class="rounded bg-gray-500 bg-opacity-40 px-1.5 py-0.5 capitalize">{download.service}</div>
    <div
      class="rounded bg-gray-500 bg-opacity-40 px-1.5 py-0.5"
      use:tooltip={{ content: toPrettyDate(download.createdAt) }}
    >
      {getTimeSinceShort(download.createdAt)}
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
