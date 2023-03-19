<script lang="ts">
  import { followCursor } from 'tippy.js';

  import DownloadIcon from '$lib/icons/DownloadIcon.svelte';
  import { tooltip, TooltipDefaults } from '$lib/tooltip';
  import type { RouterOutput } from '$lib/trpc';
  import { getContextClient } from '$lib/trpc';

  type SearchResult =
    | RouterOutput['search']['spotify']['albums'][0]
    | RouterOutput['search']['spotify']['tracks'][0];

  export let result: SearchResult;
  $: album = result.type === 'album' ? result : result.album;
  $: artwork = album.images.at(0);
  $: artists = result.artists.map((a) => a.name).join(', ');

  const trpc = getContextClient();
  const downloadMutation = trpc.downloads.download.mutation();

  const handleDownload = () => {
    $downloadMutation.mutate({ service: 'spotify', id: result.id, kind: result.type });
  };
</script>

<div class="w-[200px]">
  <button
    class="relative h-[200px] w-full shadow"
    on:click={handleDownload}
    use:tooltip={{
      content: 'Download',
      delay: [TooltipDefaults.delay, 0],
      followCursor: true,
      plugins: [followCursor]
    }}
  >
    {#if artwork}
      <img class="h-full w-full rounded object-cover" src={artwork.url} alt={result.name} />
    {:else}
      <div class="center h-full w-full rounded bg-gray-800 italic text-gray-600">No cover art</div>
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

  <div class="truncate text-sm font-bold" title={result.name}>{result.name}</div>
  <div class="text-sm text-gray-400">{artists}</div>
</div>
