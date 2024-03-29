<script lang="ts">
  import { followCursor } from 'tippy.js'

  import { TooltipDefaults, tooltip } from '$lib/actions/tooltip'
  import CoverArt from '$lib/components/CoverArt.svelte'
  import DownloadIcon from '$lib/icons/DownloadIcon.svelte'
  import { createDownloadMutation } from '$lib/services/downloads'
  import { getContextToast } from '$lib/toast/toast'
  import type { RouterOutput } from '$lib/trpc'
  import { getContextClient } from '$lib/trpc'

  import { showSuccessToast } from '../toasts'

  type SearchResult =
    | RouterOutput['search']['soundcloud']['albums'][0]
    | RouterOutput['search']['soundcloud']['tracks'][0]

  export let result: SearchResult

  const toast = getContextToast()

  const trpc = getContextClient()
  const downloadMutation = createDownloadMutation(trpc)
  const handleDownload = () => {
    $downloadMutation.mutate(
      { service: 'soundcloud', id: result.id, kind: result.kind },
      { onSuccess: () => showSuccessToast(toast, result.title) }
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
    <CoverArt src={result.artwork?.[500]} alt={result.title}>
      <DownloadIcon />
    </CoverArt>
  </button>

  <div class="truncate text-sm font-bold" title={result.title}>{result.title}</div>
  <div class="text-sm text-gray-400">{result.user.username}</div>
</div>
