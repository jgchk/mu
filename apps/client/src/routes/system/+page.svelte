<script lang="ts">
  import {
    createStartSoulseekMutation,
    createStopSoulseekMutation,
    createSystemStatusQuery,
  } from '$lib/services/system'
  import { getContextToast } from '$lib/toast/toast'
  import { getContextClient } from '$lib/trpc'

  import type { PageServerData } from './$types'
  import LastFmConfig from './LastFmConfig.svelte'
  import SlskConfig from './SlskConfig.svelte'
  import SpotifyConfig from './SpotifyConfig.svelte'

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
  <SlskConfig data={data.slskForm} {status} />
  <LastFmConfig data={data.lastFmForm} {status} />
  <SpotifyConfig data={data.spotifyForm} {status} />
{:else if $statusQuery.error}
  <p>Failed to load system status</p>
{:else}
  <p>Loading...</p>
{/if}
