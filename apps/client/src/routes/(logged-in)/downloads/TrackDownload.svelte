<script lang="ts">
  import { toErrorString } from 'utils'

  import { tooltip } from '$lib/actions/tooltip'
  import IconButton from '$lib/atoms/IconButton.svelte'
  import LinkButton from '$lib/atoms/LinkButton.svelte'
  import DeleteIcon from '$lib/icons/DeleteIcon.svelte'
  import RefreshIcon from '$lib/icons/RefreshIcon.svelte'
  import {
    createDeleteTrackDownloadMutation,
    createRetryTrackDownloadMutation,
  } from '$lib/services/downloads'
  import { getContextClient } from '$lib/trpc'

  import type { TrackDownload } from './types'

  export let download: TrackDownload

  const trpc = getContextClient()

  const retryTrackDownloadMutation = createRetryTrackDownloadMutation(trpc)
  const handleRetryTrackDownload = () => {
    $retryTrackDownloadMutation.mutate({ id: download.id, service: download.service })
  }

  const deleteTrackDownloadMutation = createDeleteTrackDownloadMutation(trpc)
  const handleDeleteTrackDownload = () => {
    $deleteTrackDownloadMutation.mutate({ id: download.id, service: download.service })
  }
</script>

<div class="max-w-4xl rounded bg-gray-900 p-4 text-gray-200">
  <div class="mb-2 flex items-center gap-4">
    <div class="flex-1 truncate text-lg">{download.name ?? 'Loading...'}</div>

    <div class="flex items-center gap-1">
      <IconButton
        kind="text"
        tooltip="Delete"
        on:click={handleDeleteTrackDownload}
        loading={$deleteTrackDownloadMutation.isLoading}
      >
        <DeleteIcon />
      </IconButton>
      <IconButton
        kind="text"
        tooltip="Retry"
        on:click={handleRetryTrackDownload}
        loading={$retryTrackDownloadMutation.isLoading}
      >
        <RefreshIcon />
      </IconButton>
    </div>

    {#if download.status === 'done'}
      <LinkButton kind="outline" href="/downloads/{download.service}/track/{download.id}/import">
        Import
      </LinkButton>
    {:else if download.status === 'downloading'}
      {download.progress ?? 0}%
    {:else if download.status === 'error'}
      <div
        class="text-error-500"
        use:tooltip={{
          content: download.error !== undefined ? toErrorString(download.error) : 'Unknown error',
        }}
      >
        Error
      </div>
    {/if}
  </div>
</div>
