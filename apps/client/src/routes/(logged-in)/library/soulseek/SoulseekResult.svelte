<script lang="ts">
  import { isDefined } from 'utils'

  import IconButton from '$lib/atoms/IconButton.svelte'
  import ChevronDownIcon from '$lib/icons/ChevronDownIcon.svelte'
  import ChevronUpIcon from '$lib/icons/ChevronUpIcon.svelte'
  import DownloadIcon from '$lib/icons/DownloadIcon.svelte'
  import { createDownloadMutation } from '$lib/services/downloads'
  import { getContextToast } from '$lib/toast/toast'
  import { getContextClient } from '$lib/trpc'
  import { cn } from '$lib/utils/classes'

  import { showSuccessToast } from '../toasts'
  import type { SortedSoulseekUserResults } from './types'

  export let item: SortedSoulseekUserResults
  let expanded = false

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
  $: folderName = item.dirname.slice(0, item.dirname.indexOf('/'))
  $: restOfFolderName = item.dirname.slice(item.dirname.indexOf('/'))

  const trpc = getContextClient()
  const downloadMutation = createDownloadMutation(trpc)
  const handleDownload = () => {
    $downloadMutation.mutate(
      {
        service: 'soulseek',
        kind: 'tracks',
        tracks: item.files.map((f) => ({ username: item.username, file: f.filename })),
      },
      { onSuccess: () => showSuccessToast(toast, folderName) }
    )
  }

  const musicFileExtensions = new Set([
    'mp3',
    'wav',
    'flac',
    'aac',
    'ogg',
    'wma',
    'alac',
    'aiff',
    'm4a',
    'm4b',
    'm4p',
    'mp2',
    'mpc',
    'ape',
    'ofr',
    'tta',
    'ac3',
    'dts',
    'amr',
    'mid',
    'midi',
    'ra',
    'rm',
    'opus',
    'spx',
    'gsm',
    'wv',
    'webm',
    'asf',
    'rmx',
    'rmvb',
    'mp1',
    'mod',
    'xm',
    'it',
    's3m',
    'mtm',
    'umx',
    'mo3',
    'cda',
  ])

  $: extensions = [
    ...new Set(
      item.files
        .map((f) => f.basename.split('.').pop()?.toLowerCase())
        .filter((e) => isDefined(e) && musicFileExtensions.has(e))
    ),
  ]

  const slotsScore = item.slotsFree ? 1 : 0
  const queueScore = item.queueLength === 0 ? 1 : 0
  const speedScore = item.avgSpeed >= 1000 * 1000 ? 1 : item.avgSpeed >= 100 * 1000 ? 0.5 : 0
  const score = slotsScore + queueScore + speedScore
  const scoreColor = score === 3 ? 'bg-success-500' : score >= 2 ? 'bg-warning-500' : 'bg-error-500'
</script>

<div class="rounded bg-gray-900">
  <div class={cn('flex w-full', expanded && 'border-b border-gray-800')}>
    <div class="flex h-full w-full flex-1 items-center justify-between gap-3 p-2 pl-4 pr-4">
      <div class={cn('mr-1 h-3 w-3 rounded-full', scoreColor)} />
      <div class="min-w-0 flex-[10] truncate text-gray-400">
        <span class="font-medium text-gray-200">{folderName}</span><span>{restOfFolderName}</span>
      </div>
      <div class="flex-1 text-right text-sm font-semibold text-gray-300">
        {item.files.length} files
      </div>
      <div class="flex-1 text-right text-sm font-semibold text-gray-300">
        {extensions.join(', ')}
      </div>
      <div class="flex-1 text-right text-sm font-semibold text-gray-300">
        {formatSize(item.size)}
      </div>
    </div>

    <div class="flex items-center justify-center border-l border-gray-800 pl-1.5 pr-1">
      <IconButton kind="text" tooltip="Download" on:click={handleDownload}>
        <DownloadIcon />
      </IconButton>

      <IconButton
        kind="text"
        tooltip={expanded ? 'Close' : 'Expand'}
        on:click={() => (expanded = !expanded)}
      >
        {#if expanded}
          <ChevronUpIcon />
        {:else}
          <ChevronDownIcon />
        {/if}
      </IconButton>
    </div>
  </div>

  {#if expanded}
    <div class="w-full max-w-3xl space-y-1 px-4 pt-2">
      {#each item.files as file (file.basename)}
        <div class="flex gap-2 text-sm font-medium text-gray-400">
          <div class="flex-1 truncate">{file.basename}</div>
          <div class="whitespace-nowrap text-right text-gray-500">{formatSize(file.size)}</div>
        </div>
      {/each}
    </div>

    <div class="flex items-center gap-4 px-3 py-3 text-sm">
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
  {/if}
</div>
