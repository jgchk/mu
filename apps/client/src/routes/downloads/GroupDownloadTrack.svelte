<script lang="ts">
  import { toErrorString } from 'utils'

  import { tooltip } from '$lib/actions/tooltip'
  import IconButton from '$lib/atoms/IconButton.svelte'
  import RefreshIcon from '$lib/icons/RefreshIcon.svelte'
  import { createRetryTrackDownloadMutation } from '$lib/services/downloads'
  import { getContextClient } from '$lib/trpc'

  import type { TrackDownload as TrackDownloadType } from './types'

  export let track: TrackDownloadType

  const trpc = getContextClient()
  const retryTrackDownloadMutation = createRetryTrackDownloadMutation(trpc)
  const handleRetryTrackDownload = () => {
    $retryTrackDownloadMutation.mutate({ id: track.id, service: track.service })
  }
</script>

<div class="contents text-gray-400">
  <div class="col-start-1 truncate">{track.name ?? 'Loading...'}</div>
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
  {#if track.status === 'error'}
    <IconButton
      tooltip="Retry"
      on:click={handleRetryTrackDownload}
      loading={$retryTrackDownloadMutation.isLoading}
    >
      <RefreshIcon />
    </IconButton>
  {/if}
</div>
