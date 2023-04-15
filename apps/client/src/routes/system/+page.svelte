<script lang="ts">
  import { capitalize, toErrorString } from 'utils'

  import { tooltip } from '$lib/actions/tooltip'
  import Button from '$lib/atoms/Button.svelte'
  import {
    createRestartSoulseekMutation,
    createStartSoulseekMutation,
    createStopSoulseekMutation,
    createSystemStatusQuery,
  } from '$lib/services/system'
  import { updateConfigError, updateConfigFail, updateConfigSuccess } from '$lib/strings'
  import { getContextToast } from '$lib/toast/toast'
  import { getContextClient } from '$lib/trpc'
  import { cn } from '$lib/utils/classes'

  import type { PageServerData } from './$types'
  import ConfigForm from './ConfigForm.svelte'

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

  <div class="flex items-center gap-4 rounded p-1.5 pl-3 hover:bg-gray-700">
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
          on:click={() => {
            if (!$startSoulseekMutation.isLoading) {
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
          on:click={() => {
            if (!$stopSoulseekMutation.isLoading) {
              $stopSoulseekMutation.mutate()
              $startSoulseekMutation.reset()
              $restartSoulseekMutation.reset()
            }
          }}
          loading={$stopSoulseekMutation.isLoading}
        >
          Stop
        </Button>
        <Button
          on:click={() => {
            if (!$restartSoulseekMutation.isLoading) {
              $restartSoulseekMutation.mutate()
              $startSoulseekMutation.reset()
              $stopSoulseekMutation.reset()
            }
          }}
          loading={$restartSoulseekMutation.isLoading}
        >
          Restart
        </Button>
      {/if}
    </div>
  </div>

  <div class="flex items-center gap-4 rounded p-1.5 pl-3 hover:bg-gray-700">
    <div>Last.fm</div>
    <div
      use:tooltip={{
        content: status.lastFm.available
          ? status.lastFm.loggedIn
            ? 'Running'
            : status.lastFm.error
            ? `Degraded: Login failed`
            : 'Not logged in'
          : `Stopped: ${toErrorString(status.lastFm.error)}`,
      }}
      class={cn(
        'h-4 w-4 rounded-full transition',
        status.lastFm.available && status.lastFm.loggedIn && 'bg-success-600',
        status.lastFm.available && !status.lastFm.loggedIn && 'bg-warning-600',
        !status.lastFm.available && 'bg-error-600'
      )}
    />
  </div>
{:else if $statusQuery.error}
  <p>Failed to load system status</p>
{:else}
  <p>Loading...</p>
{/if}

<ConfigForm
  formData={data.form}
  on:success={() => {
    toast.success(updateConfigSuccess())
    void $statusQuery.refetch()
  }}
  on:failure={({ detail: { reason } }) => {
    toast.error(updateConfigFail(reason))
    void $statusQuery.refetch()
  }}
  on:error={({ detail: { error } }) => {
    toast.error(updateConfigError(error))
    void $statusQuery.refetch()
  }}
/>
