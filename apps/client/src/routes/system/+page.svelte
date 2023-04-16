<script lang="ts">
  import { tooltip } from '$lib/actions/tooltip'
  import Button from '$lib/atoms/Button.svelte'
  import {
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

  $: statusQuery = createSystemStatusQuery(trpc, {
    refetchInterval:
      $startSoulseekMutation.isLoading || $stopSoulseekMutation.isLoading ? 1000 : false,
  })
</script>

{#if $statusQuery.data}
  {@const status = $statusQuery.data}

  <div class="flex items-center gap-4 rounded p-1.5 pl-3">
    <div>Soulseek</div>
    <div
      use:tooltip={{
        content:
          status.soulseek.status === 'stopped'
            ? 'Stopped'
            : status.soulseek.status === 'errored'
            ? `Error: ${status.soulseek.error}`
            : status.soulseek.status === 'logging-in'
            ? 'Logging in...'
            : 'Running',
      }}
      class={cn(
        'h-4 w-4 rounded-full transition',
        status.soulseek.status === 'stopped' && 'bg-error-600',
        status.soulseek.status === 'errored' && 'bg-error-600',
        status.soulseek.status === 'logging-in' && 'bg-warning-600',
        status.soulseek.status === 'logged-in' && 'bg-success-600'
      )}
    />
    <div class="flex flex-1 items-center justify-end gap-1">
      {#if status.soulseek.status === 'logged-in'}
        <Button
          kind="text"
          on:click={() => {
            if (!$startSoulseekMutation.isLoading) {
              toast.success('Restarting Soulseek...')
              $startSoulseekMutation.reset()
              $stopSoulseekMutation.reset()
            }
          }}
          loading={$startSoulseekMutation.isLoading}
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
            }
          }}
          loading={$stopSoulseekMutation.isLoading}
        >
          Stop
        </Button>
      {:else}
        <Button
          kind="outline"
          on:click={() => {
            if (!$startSoulseekMutation.isLoading) {
              toast.success('Starting Soulseek...')
              $startSoulseekMutation.mutate()
              $stopSoulseekMutation.reset()
            }
          }}
          loading={$startSoulseekMutation.isLoading}
        >
          Start
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
