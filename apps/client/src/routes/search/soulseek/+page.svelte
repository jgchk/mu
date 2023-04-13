<script lang="ts">
  import Button from '$lib/atoms/Button.svelte'
  import { createStartSoulseekMutation, createSystemStatusQuery } from '$lib/services/system'
  import { getContextToast } from '$lib/toast/toast'
  import { getContextClient } from '$lib/trpc'

  import type { PageData } from './$types'
  import Page from './Page.svelte'

  export let data: PageData

  const trpc = getContextClient()
  const statusQuery = createSystemStatusQuery(trpc)

  const toast = getContextToast()
  const startSoulseekMutation = createStartSoulseekMutation(trpc, {
    showToast: false,
    onError: (error) => {
      toast.error(`Error starting Soulseek: ${error.message}`)
    },
  })
</script>

{#if $statusQuery.data?.soulseek !== 'running'}
  <div class="flex h-full max-h-72 flex-col items-center justify-center gap-2">
    <div class="text-2xl text-gray-500">Soulseek is not running</div>
    <div>
      <Button
        on:click={() => {
          if (!$startSoulseekMutation.isLoading) {
            $startSoulseekMutation.mutate()
          }
        }}
        loading={$startSoulseekMutation.isLoading}
      >
        Start
      </Button>
    </div>
  </div>
{:else}
  <Page {data} />
{/if}
