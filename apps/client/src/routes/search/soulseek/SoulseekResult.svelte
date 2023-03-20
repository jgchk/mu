<script lang="ts">
  import DownloadIcon from '$lib/icons/DownloadIcon.svelte';
  import { tooltip } from '$lib/tooltip';
  import { cn } from '$lib/utils/classes';

  import type { SortedSoulseekUserResults } from './types';

  export let item: SortedSoulseekUserResults;
  export let isLast: boolean;

  const formatSpeed = (bytes: number) => {
    const gb = bytes / 1000 / 1000 / 1000;
    if (gb >= 1) return `${gb.toFixed(2)} Gb/s`;
    const mb = bytes / 1000 / 1000;
    if (mb >= 1) return `${mb.toFixed(2)} Mb/s`;
    const kb = bytes / 1000;
    if (kb >= 1) return `${kb.toFixed(2)} Kb/s`;
    return `${bytes} B/s`;
  };

  const formatSize = (bytes: bigint) => {
    const gb = Number(bytes) / 1000 / 1000 / 1000;
    if (gb >= 1) return `${gb.toFixed(2)} Gb`;
    const mb = Number(bytes) / 1000 / 1000;
    if (mb >= 1) return `${mb.toFixed(2)} Mb`;
    const kb = Number(bytes) / 1000;
    if (kb >= 1) return `${kb.toFixed(2)} Kb`;
    return `${bytes} B`;
  };
</script>

<div class={cn('mx-4 mt-4 max-w-4xl rounded bg-gray-900 p-4 text-gray-200', isLast && 'mb-4')}>
  <div class="files-grid items-center">
    <div class="contents">
      <div class="mb-2 text-lg">{item.dirname}</div>
      <div class="mb-2 text-right text-lg">{formatSize(item.size)}</div>
      <button
        class="mb-2 h-5 w-5 text-right text-lg hover:text-white"
        use:tooltip={{ content: 'Download All' }}
      >
        <DownloadIcon />
      </button>
    </div>
    {#each item.files as file (file.basename)}
      <div class="contents text-gray-400">
        <div>{file.basename}</div>
        <div class="text-right">{formatSize(file.size)}</div>
        <button class="h-5 w-5 text-right hover:text-white" use:tooltip={{ content: 'Download' }}>
          <DownloadIcon />
        </button>
      </div>
    {/each}
  </div>
  <div class="mt-2 flex gap-4 text-sm">
    <div>{item.username}</div>
    <div>{formatSpeed(item.avgSpeed)}</div>
    <div>
      {#if item.slotsFree}
        Free Slots
      {:else}
        No Slots
      {/if}
    </div>
    <div>
      {#if item.queueLength === 0}
        Free Queue
      {:else}
        {item.queueLength} Queued
      {/if}
    </div>
  </div>
</div>

<style lang="postcss">
  .files-grid {
    display: grid;
    grid-template-columns: auto 1fr auto;
    column-gap: theme(spacing.4);
  }
</style>
