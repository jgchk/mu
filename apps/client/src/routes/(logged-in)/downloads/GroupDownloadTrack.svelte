<script lang="ts">
  import { toErrorString } from 'utils'

  import { tooltip } from '$lib/actions/tooltip'
  import IconButton from '$lib/atoms/IconButton.svelte'
  import DeleteIcon from '$lib/icons/DeleteIcon.svelte'
  import RefreshIcon from '$lib/icons/RefreshIcon.svelte'
  import {
    createDeleteTrackDownloadMutation,
    createRetryTrackDownloadMutation,
  } from '$lib/services/downloads'
  import { getContextClient } from '$lib/trpc'

  import type { TrackDownload as TrackDownloadType } from './types'

  export let track: TrackDownloadType

  const trpc = getContextClient()

  const retryTrackDownloadMutation = createRetryTrackDownloadMutation(trpc)
  const handleRetryTrackDownload = () => {
    $retryTrackDownloadMutation.mutate({ id: track.id, service: track.service })
  }

  const deleteTrackDownloadMutation = createDeleteTrackDownloadMutation(trpc)
  const handleDeleteTrackDownload = () => {
    $deleteTrackDownloadMutation.mutate({ id: track.id, service: track.service })
  }
</script>

<div class="flex items-center gap-4 text-gray-400">
  <div class="flex-1 truncate">{track.name ?? 'Loading...'}</div>

  <div class="flex items-center gap-1">
    <IconButton
      kind="text"
      tooltip="Retry"
      on:click={handleRetryTrackDownload}
      loading={$retryTrackDownloadMutation.isLoading}
    >
      <RefreshIcon />
    </IconButton>
    <IconButton
      kind="text"
      tooltip="Delete"
      on:click={handleDeleteTrackDownload}
      loading={$deleteTrackDownloadMutation.isLoading}
    >
      <DeleteIcon />
    </IconButton>
  </div>

  {#if track.status === 'done'}
    <div>Done</div>
  {:else if track.status === 'downloading'}
    <div>{track.progress ?? 0}%</div>
  {:else if track.status === 'error'}
    <div
      class="text-error-500"
      use:tooltip={{
        content: track.error !== undefined ? toErrorString(track.error) : 'Unknown error',
      }}
    >
      Error
    </div>
  {/if}
</div>
