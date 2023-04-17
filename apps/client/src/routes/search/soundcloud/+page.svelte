<script lang="ts">
  import Button from '$lib/atoms/Button.svelte'
  import LinkButton from '$lib/atoms/LinkButton.svelte'
  import { createStartSoundcloudMutation, createSystemStatusQuery } from '$lib/services/system'
  import { getContextClient } from '$lib/trpc'
  import { createEditLink } from '$lib/utils/system-config'

  import type { PageData } from './$types'
  import Page from './Page.svelte'

  export let data: PageData

  const trpc = getContextClient()
  const statusQuery = createSystemStatusQuery(trpc)
  const startSoundcloudMutation = createStartSoundcloudMutation(trpc)

  const editLink = createEditLink('soundcloud')
</script>

{#if $statusQuery.data}
  {@const status = $statusQuery.data.soundcloud}
  {#if status.status === 'running'}
    <Page {data} />
  {:else if status.status === 'stopped'}
    <div class="flex h-full max-h-72 flex-col items-center justify-center gap-2">
      <div class="text-2xl text-gray-500">Soundcloud is not running</div>
      <div>
        <Button
          on:click={() => {
            if (!$startSoundcloudMutation.isLoading) {
              $startSoundcloudMutation.mutate()
            }
          }}
          loading={$startSoundcloudMutation.isLoading}
        >
          Start
        </Button>
      </div>
    </div>
  {:else if status.status === 'errored'}
    <div class="flex h-full max-h-72 flex-col items-center justify-center gap-2">
      <div class="text-gray-500 text-2xl">Soundcloud ran into an error</div>
      <div class="text-error-500 -mt-1 mb-1">{status.error}</div>
      <LinkButton href={$editLink}>Edit Config</LinkButton>
    </div>
  {:else}
    <div class="flex h-full max-h-72 flex-col items-center justify-center gap-2">
      <div class="text-error-500 text-2xl">Spotify is not configured for search</div>
      <LinkButton href={$editLink}>Edit Config</LinkButton>
    </div>
  {/if}
{:else if $statusQuery.error}
  <div class="text-2xl text-gray-500">Error loading status</div>
{:else}
  <div>Loading...</div>
{/if}
