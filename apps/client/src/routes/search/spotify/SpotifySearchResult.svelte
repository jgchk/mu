<script lang="ts">
  import { followCursor } from 'tippy.js'

  import { tooltip, TooltipDefaults } from '$lib/actions/tooltip'
  import CoverArt from '$lib/components/CoverArt.svelte'
  import DownloadIcon from '$lib/icons/DownloadIcon.svelte'
  import { createDownloadMutation } from '$lib/services/downloads'
  import { getContextToast } from '$lib/toast/toast'
  import type { RouterOutput } from '$lib/trpc'
  import { getContextClient } from '$lib/trpc'

  import { showSuccessToast } from '../toasts'

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

  const toast = getContextToast()

  const trpc = getContextClient()
  const downloadMutation = createDownloadMutation(trpc)
  const handleDownload = () => {
    $downloadMutation.mutate(
      { service: 'spotify', id: result.id, kind: result.type },
      { onSuccess: () => showSuccessToast(toast, result.name) }
    )
  }
</script>

<div class="w-full overflow-hidden">
  <button
    type="button"
    class="w-full"
    on:click={handleDownload}
    use:tooltip={{
      content: 'Download',
      delay: [TooltipDefaults.delay, 0],
      followCursor: true,
      plugins: [followCursor],
    }}
  >
    <CoverArt src={artwork} alt={result.name}>
      <DownloadIcon />
    </CoverArt>
  </button>

  <div class="truncate text-sm font-bold" title={result.name}>{result.name}</div>
  <div class="text-sm text-gray-400">{artists}</div>
</div>
