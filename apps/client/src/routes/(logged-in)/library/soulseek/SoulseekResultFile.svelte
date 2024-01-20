<script lang="ts">
  import { tooltip } from '$lib/actions/tooltip'
  import DownloadIcon from '$lib/icons/DownloadIcon.svelte'
  import { createDownloadMutation } from '$lib/services/downloads'
  import { getContextToast } from '$lib/toast/toast'
  import { getContextClient } from '$lib/trpc'

  import { showSuccessToast } from '../toasts'
  import type { SoulseekFile } from './types'

  export let file: SoulseekFile
  export let username: string

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

  const trpc = getContextClient()
  const downloadMutation = createDownloadMutation(trpc)
  const handleDownload = () => {
    $downloadMutation.mutate(
      { service: 'soulseek', kind: 'track', username, file: file.filename },
      { onSuccess: () => showSuccessToast(toast, file.basename) }
    )
  }
</script>

<div class="contents text-sm font-medium text-gray-400">
  <div>{file.basename}</div>
  <div class="whitespace-nowrap text-right text-gray-500">{formatSize(file.size)}</div>
  <button
    type="button"
    class="h-5 w-5 text-right hover:text-white"
    use:tooltip={{ content: 'Download' }}
    on:click={handleDownload}
  >
    <DownloadIcon />
  </button>
</div>
