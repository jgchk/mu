<script lang="ts">
  import { followCursor } from 'tippy.js';

  import DownloadIcon from '$lib/icons/DownloadIcon.svelte';
  import { tooltip, TooltipDefaults } from '$lib/tooltip';
  import type { RouterOutput } from '$lib/trpc';
  import { getContextClient } from '$lib/trpc';

  type SearchResult =
    | RouterOutput['search']['soundcloud']['albums'][0]
    | RouterOutput['search']['soundcloud']['tracks'][0];

  export let result: SearchResult;

  const trpc = getContextClient();
  const downloadMutation = trpc.downloads.download.mutation();

  const handleDownload = () => {
    $downloadMutation.mutate({ service: 'soundcloud', id: result.id, kind: result.kind });
  };
</script>

<div class="w-full overflow-hidden">
  <button
    class="relative w-full shadow"
    on:click={handleDownload}
    use:tooltip={{
      content: 'Download',
      delay: [TooltipDefaults.delay, 0],
      followCursor: true,
      plugins: [followCursor]
    }}
  >
    {#if result.artwork?.[200]}
      <img class="w-full rounded object-cover" src={result.artwork[200]} alt={result.title} />
    {:else}
      <div class="relative w-full rounded bg-gray-800 pt-[100%] italic text-gray-600">
        <div class="center absolute top-0 left-0 h-full w-full">No cover art</div>
      </div>
    {/if}
    <div
      class="center hover:border-primary-500 group absolute top-0 left-0 h-full w-full rounded border border-white border-opacity-20 transition hover:border-opacity-100 hover:bg-gray-900 hover:bg-opacity-60 active:bg-opacity-80"
    >
      <DownloadIcon
        size={32}
        class="group-active:text-primary-500 text-white opacity-0 transition group-hover:opacity-100"
      />
    </div>
  </button>

  <div class="truncate text-sm font-bold" title={result.title}>{result.title}</div>
  <div class="text-sm text-gray-400">{result.user.username}</div>
</div>
