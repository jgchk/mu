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

<div class="contents text-gray-400">
  <div class="col-start-1 truncate">{track.name ?? 'Loading...'}</div>
  <div class="text-right">
    {#if track.status === 'done'}
      Done
    {:else if track.status === 'downloading'}
      {track.progress ?? 0}%
    {:else if track.status === 'error'}
      <span
        class="text-error-500"
        use:tooltip={{
          content: track.error !== undefined ? toErrorString(track.error) : 'Unknown error',
        }}
      >
        Error
      </span>
    {/if}
  </div>

  <div class="flex items-center">
    <IconButton
      tooltip="Retry"
      on:click={handleRetryTrackDownload}
      loading={$retryTrackDownloadMutation.isLoading}
    >
      <RefreshIcon />
    </IconButton>
    <IconButton
      tooltip="Delete"
      on:click={handleDeleteTrackDownload}
      loading={$deleteTrackDownloadMutation.isLoading}
    >
      <DeleteIcon />
    </IconButton>
  </div>
</div>
