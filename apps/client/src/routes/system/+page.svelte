<script lang="ts">
  import { capitalize } from 'utils'

  import { tooltip } from '$lib/actions/tooltip'
  import Button from '$lib/atoms/Button.svelte'
  import {
    createRestartSoulseekMutation,
    createStartSoulseekMutation,
    createStopSoulseekMutation,
    createSystemStatusQuery,
  } from '$lib/services/system'
  import { getContextToast } from '$lib/toast/toast'
  import { getContextClient } from '$lib/trpc'
  import { cn } from '$lib/utils/classes'

  import type { PageServerData } from './$types'
  import ConfigForm from './LastFmConfig.svelte'

  export let data: PageServerData

  const trpc = getContextClient()
  const toast = getContextToast()

  const startSoulseekMutation = createStartSoulseekMutation(trpc, {
    showToast: false,
    onError: (error) => {
      toast.error(`Error starting Soulseek: ${error.message}`)
    },
  })
  const stopSoulseekMutation = createStopSoulseekMutation(trpc, {
    showToast: false,
    onError: (error) => {
      toast.error(`Error stopping Soulseek: ${error.message}`)
    },
  })
  const restartSoulseekMutation = createRestartSoulseekMutation(trpc, {
    showToast: false,
    onError: (error) => {
      toast.error(`Error restarting Soulseek: ${error.message}`)
    },
  })

  $: statusQuery = createSystemStatusQuery(trpc, {
    refetchInterval:
      $startSoulseekMutation.isLoading ||
      $stopSoulseekMutation.isLoading ||
      $restartSoulseekMutation.isLoading
        ? 1000
        : false,
  })
</script>

{#if $statusQuery.data}
  {@const status = $statusQuery.data}

  <div class="flex items-center gap-4 rounded p-1.5 pl-3">
    <div>Soulseek</div>
    <div
      use:tooltip={{ content: capitalize(status.soulseek) }}
      class={cn(
        'h-4 w-4 rounded-full transition',
        status.soulseek === 'stopped' && 'bg-error-600',
        status.soulseek === 'starting' && 'bg-warning-600',
        status.soulseek === 'running' && 'bg-success-600'
      )}
    />
    <div class="flex flex-1 items-center justify-end gap-1">
      {#if status.soulseek === 'stopped'}
        <Button
          kind="outline"
          on:click={() => {
            if (!$startSoulseekMutation.isLoading) {
              toast.success('Starting Soulseek...')
              $startSoulseekMutation.mutate()
              $stopSoulseekMutation.reset()
              $restartSoulseekMutation.reset()
            }
          }}
          loading={$startSoulseekMutation.isLoading}
        >
          Start
        </Button>
      {:else}
        <Button
          kind="text"
          on:click={() => {
            if (!$restartSoulseekMutation.isLoading) {
              toast.success('Restarting Soulseek...')
              $restartSoulseekMutation.mutate()
              $startSoulseekMutation.reset()
              $stopSoulseekMutation.reset()
            }
          }}
          loading={$restartSoulseekMutation.isLoading}
        >
          Restart
        </Button>
        <Button
          kind="outline"
          on:click={() => {
            if (!$stopSoulseekMutation.isLoading) {
              toast.success('Stopping Soulseek...')
              $stopSoulseekMutation.mutate()
              $startSoulseekMutation.reset()
              $restartSoulseekMutation.reset()
            }
          }}
          loading={$stopSoulseekMutation.isLoading}
        >
          Stop
        </Button>
      {/if}
    </div>
  </div>

  <ConfigForm formData={data.form} {status} />
{:else if $statusQuery.error}
  <p>Failed to load system status</p>
{:else}
  <p>Loading...</p>
{/if}
