<script lang="ts">
  import { followCursor } from 'tippy.js'

  import { tooltip, TooltipDefaults } from '$lib/actions/tooltip'
  import DownloadIcon from '$lib/icons/DownloadIcon.svelte'
  import type { RouterOutput } from '$lib/trpc'
  import { getContextClient } from '$lib/trpc'

  type SearchResult =
    | RouterOutput['search']['spotify']['albums'][0]
    | RouterOutput['search']['spotify']['tracks'][0]

  export let result: SearchResult
  $: album = result.type === 'album' ? result : result.album
  let artwork: string | undefined
  $: {
    const sortedImages = album.images.sort((a, b) => a.width - b.width)
    const smallestImageAbove400px = sortedImages.find((i) => i.width >= 400)
    if (smallestImageAbove400px) {
      artwork = smallestImageAbove400px.url
    } else if (sortedImages.length > 0) {
      artwork = sortedImages[sortedImages.length - 1].url
    } else {
      artwork = undefined
    }
  }
  $: artists = result.artists.map((a) => a.name).join(', ')

  const trpc = getContextClient()
  const downloadMutation = trpc.downloads.download.mutation()

  const handleDownload = () => {
    $downloadMutation.mutate({ service: 'spotify', id: result.id, kind: result.type })
  }
</script>

<div class="w-full overflow-hidden">
  <button
    type="button"
    class="relative w-full shadow"
    on:click={handleDownload}
    use:tooltip={{
      content: 'Download',
      delay: [TooltipDefaults.delay, 0],
      followCursor: true,
      plugins: [followCursor],
    }}
  >
    {#if artwork}
      <img class="w-full rounded object-cover" src={artwork} alt={result.name} />
    {:else}
      <div class="relative w-full rounded bg-gray-800 pt-[100%] italic text-gray-600">
        <div class="center absolute left-0 top-0 h-full w-full">No cover art</div>
      </div>
    {/if}
    <div
      class="center hover:border-primary-500 group absolute left-0 top-0 h-full w-full rounded border border-white border-opacity-20 transition hover:border-opacity-100 hover:bg-gray-900 hover:bg-opacity-60 active:bg-opacity-80"
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
