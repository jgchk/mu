<script lang="ts">
  import { tooltipAction, TooltipDefaults } from '$lib/action-tooltip'
  import DownloadIcon from '$lib/icons/DownloadIcon.svelte'
  import { getContextClient, type RouterOutput } from '$lib/trpc'
  import { followCursor } from 'tippy.js'

  type SearchResult = RouterOutput['search'][number]

  export let result: SearchResult

  const trpc = getContextClient()
  const downloadMutation = trpc.download.mutation()

  const handleDownload = () => {
    $downloadMutation.mutate({ id: result.id })
  }
</script>

<div class="w-[200px]">
  <button
    class="relative h-[200px] w-full shadow"
    on:click={handleDownload}
    use:tooltipAction={{
      content: 'Download',
      delay: [TooltipDefaults.delay, 0],
      followCursor: true,
      plugins: [followCursor],
    }}
  >
    {#if result.artwork?.[200]}
      <img
        class="h-full w-full rounded object-cover"
        src={result.artwork[200]}
        alt={result.title}
      />
    {:else}
      <div class="center h-full w-full rounded bg-gray-800 italic text-gray-600">No cover art</div>
    {/if}
    <div
      class="center group absolute top-0 left-0 h-full w-full rounded border border-white border-opacity-20 transition hover:border-primary-500 hover:border-opacity-100 hover:bg-gray-900 hover:bg-opacity-60"
    >
      <DownloadIcon size={32} class="opacity-0 transition group-hover:opacity-100" />
    </div>
  </button>

  <div class="truncate text-sm font-bold" title={result.title}>{result.title}</div>
  <div class="text-sm text-gray-400">{result.user.username}</div>
</div>
