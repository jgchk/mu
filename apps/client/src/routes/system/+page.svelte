<script lang="ts">
  import { tooltip } from '$lib/actions/tooltip'
  import Button from '$lib/atoms/Button.svelte'
  import {
    createRestartSoulseekMutation,
    createStartSoulseekMutation,
    createStopSoulseekMutation,
    createSystemStatusQuery,
  } from '$lib/services/system'
  import { getContextClient } from '$lib/trpc'
  import { cn } from '$lib/utils/classes'
  import { capitalize } from '$lib/utils/string'

  const trpc = getContextClient()
  const statusQuery = createSystemStatusQuery(trpc)

  const startSoulseekMutation = createStartSoulseekMutation(trpc)
  const stopSoulseekMutation = createStopSoulseekMutation(trpc)
  const restartSoulseekMutation = createRestartSoulseekMutation(trpc)
</script>

{#if $statusQuery.data}
  {@const status = $statusQuery.data}

  <div class="flex items-center gap-4 rounded p-1.5 px-3 hover:bg-gray-700">
    <div>Soulseek</div>
    <div>
      <div
        use:tooltip={{ content: capitalize(status.soulseek) }}
        class={cn(
          'h-4 w-4 rounded-full',
          status.soulseek === 'stopped' && 'bg-error-600',
          status.soulseek === 'starting' && 'bg-warning-600',
          status.soulseek === 'running' && 'bg-success-600'
        )}
      />
    </div>
    <div class="flex flex-1 items-center justify-end gap-1">
      {#if status.soulseek === 'stopped'}
        <Button
          on:click={() => {
            if (!$startSoulseekMutation.isLoading) {
              $startSoulseekMutation.mutate()
            }
          }}
          loading={$startSoulseekMutation.isLoading}>Start</Button
        >
      {:else}
        <Button
          on:click={() => {
            if (!$stopSoulseekMutation.isLoading) {
              $stopSoulseekMutation.mutate()
            }
          }}
          loading={$stopSoulseekMutation.isLoading}>Stop</Button
        >
        <Button
          on:click={() => {
            if (!$restartSoulseekMutation.isLoading) {
              $restartSoulseekMutation.mutate()
            }
          }}
          loading={$restartSoulseekMutation.isLoading}>Restart</Button
        >
      {/if}
    </div>
  </div>
{:else if $statusQuery.error}
  <p>Failed to load system status</p>
{:else}
  <p>Loading...</p>
{/if}
