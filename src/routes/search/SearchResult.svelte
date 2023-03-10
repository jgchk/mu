<script lang="ts">
  import { getContextClient, type RouterOutput } from '$lib/trpc'

  type SearchResult = RouterOutput['search'][number]

  export let result: SearchResult

  const trpc = getContextClient()
  const downloadMutation = trpc.download.mutation()

  const handleDownload = () => {
    $downloadMutation.mutate({ id: result.id })
  }
</script>

<div class="w-[200px]">
  <button class="relative h-[200px] w-full shadow" on:click={handleDownload}>
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
      class="absolute top-0 left-0 h-full w-full rounded border border-white border-opacity-20"
    />
  </button>

  <div class="truncate text-sm font-bold" title={result.title}>{result.title}</div>
  <div class="text-sm text-gray-400">{result.user.username}</div>
</div>
