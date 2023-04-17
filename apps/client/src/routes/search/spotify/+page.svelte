<script lang="ts">
  import Button from '$lib/atoms/Button.svelte'
  import LinkButton from '$lib/atoms/LinkButton.svelte'
  import { createStartSpotifyMutation, createSystemStatusQuery } from '$lib/services/system'
  import { getContextClient } from '$lib/trpc'
  import { createEditLink } from '$lib/utils/system-config'

  import type { PageData } from './$types'
  import Page from './Page.svelte'

  export let data: PageData

  const trpc = getContextClient()
  const statusQuery = createSystemStatusQuery(trpc)
  const startSpotifyMutation = createStartSpotifyMutation(trpc)

  const editLink = createEditLink('spotify')
</script>

{#if $statusQuery.data}
  {@const status = $statusQuery.data.spotify}
  {#if status.features.webApi}
    <Page {data} />
  {:else if status.status === 'stopped'}
    <div class="flex h-full max-h-72 flex-col items-center justify-center gap-2">
      <div class="text-2xl text-gray-500">Spotify is not running</div>
      <Button
        on:click={() => {
          if (!$startSpotifyMutation.isLoading) {
            $startSpotifyMutation.mutate()
          }
        }}
        loading={$startSpotifyMutation.isLoading}
      >
        Start
      </Button>
    </div>
  {:else if status.errors.webApi}
    <div class="flex h-full max-h-72 flex-col items-center justify-center gap-2">
      <div class="text-2xl text-gray-500">Spotify ran into an error</div>
      <div class="text-error-500 -mt-1 mb-1">{status.errors.webApi}</div>
      <div class="flex gap-1">
        <LinkButton href={$editLink}>Edit Config</LinkButton>
        <Button
          kind="outline"
          on:click={() => {
            if (!$startSpotifyMutation.isLoading) {
              $startSpotifyMutation.mutate()
            }
          }}
          loading={$startSpotifyMutation.isLoading}
        >
          Restart
        </Button>
      </div>
    </div>
  {:else if status.status === 'starting'}
    <div class="flex h-full max-h-72 flex-col items-center justify-center gap-2">
      <div class="text-2xl text-gray-500">Spotify is starting...</div>
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
