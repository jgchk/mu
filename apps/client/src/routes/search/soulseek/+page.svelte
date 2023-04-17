<script lang="ts">
  import Button from '$lib/atoms/Button.svelte'
  import LinkButton from '$lib/atoms/LinkButton.svelte'
  import { createStartSoulseekMutation, createSystemStatusQuery } from '$lib/services/system'
  import { getContextClient } from '$lib/trpc'
  import { createEditLink } from '$lib/utils/system-config'

  import type { PageData } from './$types'
  import Page from './Page.svelte'

  export let data: PageData

  const trpc = getContextClient()
  const statusQuery = createSystemStatusQuery(trpc)
  const startSoulseekMutation = createStartSoulseekMutation(trpc)

  const editLink = createEditLink('soulseek')
</script>

{#if $statusQuery.data}
  {@const status = $statusQuery.data.soulseek}
  {#if status.status === 'logged-in'}
    <Page {data} />
  {:else if status.status === 'stopped'}
    <div class="flex h-full max-h-72 flex-col items-center justify-center gap-2">
      <div class="text-2xl text-gray-500">Soulseek is not running</div>
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
  {:else if status.status === 'errored'}
    <div class="flex h-full max-h-72 flex-col items-center justify-center gap-2">
      <div class="text-2xl text-gray-500">Soulseek ran into an error</div>
      <div class="text-error-500 -mt-1 mb-1">{status.error}</div>
      <div class="flex gap-1">
        <LinkButton href={$editLink}>Edit Config</LinkButton>
        <Button
          kind="outline"
          on:click={() => {
            if (!$startSoulseekMutation.isLoading) {
              $startSoulseekMutation.mutate()
            }
          }}
          loading={$startSoulseekMutation.isLoading}
        >
          Restart
        </Button>
      </div>
    </div>
  {:else if status.status === 'logging-in'}
    <div class="flex h-full max-h-72 flex-col items-center justify-center gap-2">
      <div class="text-2xl text-gray-500">Soulseek is logging in...</div>
      <Button on:click={() => $statusQuery.refetch()} loading={$statusQuery.isLoading}
        >Refresh</Button
      >
    </div>
  {/if}
{:else if $statusQuery.error}
  <div class="text-2xl text-gray-500">Error loading status</div>
{:else}
  <div>Loading...</div>
{/if}
