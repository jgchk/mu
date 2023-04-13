<script lang="ts">
  import Button from '$lib/atoms/Button.svelte'
  import {
    createRestartSoulseekMutation,
    createStartSoulseekMutation,
    createStopSoulseekMutation,
    createSystemStatusQuery,
  } from '$lib/services/system'
  import { getContextClient } from '$lib/trpc'

  const trpc = getContextClient()
  const statusQuery = createSystemStatusQuery(trpc)

  const startSoulseekMutation = createStartSoulseekMutation(trpc)
  const stopSoulseekMutation = createStopSoulseekMutation(trpc)
  const restartSoulseekMutation = createRestartSoulseekMutation(trpc)
</script>

{#if $statusQuery.data}
  {@const status = $statusQuery.data}
  <h1>System status</h1>
  <div>Soulseek: {status.soulseek}</div>
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
{:else if $statusQuery.error}
  <p>Failed to load system status</p>
{:else}
  <p>Loading...</p>
{/if}
