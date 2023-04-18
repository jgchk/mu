<script lang="ts">
  import { getTimeSinceShort, sum, toPrettyDate } from 'utils'

  import { tooltip } from '$lib/actions/tooltip'
  import LinkButton from '$lib/atoms/LinkButton.svelte'

  import GroupDownloadTrack from './GroupDownloadTrack.svelte'
  import type {
    GroupDownload as GroupDownloadType,
    TrackDownload as TrackDownloadType,
  } from './types'

  export let download: GroupDownloadType & { tracks: TrackDownloadType[] }

  let status: { type: 'complete' | 'queued' } | { type: 'downloading'; progress: number } = {
    type: 'queued',
  }
  $: {
    if (download.tracks.every((track) => track.progress === 100)) {
      status = { type: 'complete' }
    } else if (download.tracks.every((track) => track.progress === null)) {
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
  <div
    class="grid items-center gap-x-4"
    style:grid-template-columns={download.tracks.some((t) => t.status === 'error')
      ? 'auto 1fr auto'
      : 'auto 1fr'}
  >
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
      <GroupDownloadTrack {track} />
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
