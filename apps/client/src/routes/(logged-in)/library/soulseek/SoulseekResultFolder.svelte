<script lang="ts">
  import { tooltip } from '$lib/actions/tooltip'
  import DownloadIcon from '$lib/icons/DownloadIcon.svelte'
  import { createDownloadMutation } from '$lib/services/downloads'
  import { getContextToast } from '$lib/toast/toast'
  import { getContextClient } from '$lib/trpc'
  import { cn } from '$lib/utils/classes'

  import { showSuccessToast } from '../toasts'
  import SoulseekResultFile from './SoulseekResultFile.svelte'
  import type { SortedSoulseekUserResults } from './types'

  export let item: SortedSoulseekUserResults
  export let isLast: boolean

  const formatSpeed = (bytes: number) => {
    const gb = bytes / 1000 / 1000 / 1000
    if (gb >= 1) return `${gb.toFixed(2)} Gb/s`
    const mb = bytes / 1000 / 1000
    if (mb >= 1) return `${mb.toFixed(2)} Mb/s`
    const kb = bytes / 1000
    if (kb >= 1) return `${kb.toFixed(2)} Kb/s`
    return `${bytes} B/s`
  }

  const formatSize = (bytes: bigint) => {
    const gb = Number(bytes) / 1000 / 1000 / 1000
    if (gb >= 1) return `${gb.toFixed(2)} Gb`
    const mb = Number(bytes) / 1000 / 1000
    if (mb >= 1) return `${mb.toFixed(2)} Mb`
    const kb = Number(bytes) / 1000
    if (kb >= 1) return `${kb.toFixed(2)} Kb`
    return `${bytes} B`
  }

  const toast = getContextToast()
  $: dirpart = item.dirname.slice(0, item.dirname.indexOf('/'))

  const trpc = getContextClient()
  const downloadMutation = createDownloadMutation(trpc)
  const handleDownload = () => {
    $downloadMutation.mutate(
      {
        service: 'soulseek',
        kind: 'tracks',
        tracks: item.files.map((f) => ({ username: item.username, file: f.filename })),
      },
      { onSuccess: () => showSuccessToast(toast, dirpart) }
    )
  }
</script>

<div class={cn('mx-4 mt-4 max-w-4xl rounded bg-gray-900 p-4 text-gray-200', isLast && 'mb-4')}>
  <div class="files-grid items-center">
    <div class="contents">
      <div class="mb-2 font-semibold tracking-wide text-gray-300">{item.dirname}</div>
      <div class="mb-2 whitespace-nowrap text-right text-sm font-semibold text-gray-400">
        {formatSize(item.size)}
      </div>
      <button
        type="button"
        class="mb-2 h-5 w-5 text-right text-lg hover:text-white"
        use:tooltip={{ content: 'Download All' }}
        on:click={handleDownload}
      >
        <DownloadIcon />
      </button>
    </div>

    {#each item.files as file (file.basename)}
      <SoulseekResultFile {file} username={item.username} />
    {/each}
  </div>
  <div class="mt-3 flex items-center gap-4 text-sm">
    <div class="rounded bg-gray-500 bg-opacity-40 px-1.5 py-0.5">{item.username}</div>
    <div
      class={cn(
        'rounded bg-opacity-40 px-1.5 py-0.5',
        item.avgSpeed >= 1000 * 1000 // 1 Mb/s
          ? 'bg-success-500'
          : item.avgSpeed >= 100 * 1000 // 100 Kb/s
          ? 'bg-warning-500'
          : 'bg-error-500'
      )}
    >
      {formatSpeed(item.avgSpeed)}
    </div>
    {#if item.slotsFree}
      <div class="bg-success-500 rounded bg-opacity-40 px-1.5 py-0.5">Free Slots</div>
    {:else}
      <div class="bg-error-500 rounded bg-opacity-40 px-1.5 py-0.5">No Slots</div>
    {/if}
    {#if item.queueLength === 0}
      <div class="bg-success-500 rounded bg-opacity-40 px-1.5 py-0.5">Free Queue</div>
    {:else}
      <div
        class={cn(
          'rounded bg-opacity-40 px-1.5 py-0.5',
          item.queueLength >= 100 ? 'bg-error-500' : 'bg-warning-500'
        )}
      >
        {item.queueLength} Queued
      </div>
    {/if}
  </div>
</div>

<style lang="postcss">
  .files-grid {
    display: grid;
    grid-template-columns: auto 1fr auto;
    column-gap: theme(spacing.4);
    row-gap: theme(spacing.1);
  }
</style>
