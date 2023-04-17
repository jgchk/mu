<script lang="ts">
  import { createSystemStatusQuery } from '$lib/services/system'
  import { getContextClient } from '$lib/trpc'

  import type { PageServerData } from './$types'
  import LastFmConfig from './LastFmConfig.svelte'
  import SlskConfig from './SlskConfig.svelte'
  import SoundcloudConfig from './SoundcloudConfig.svelte'
  import SpotifyConfig from './SpotifyConfig.svelte'

  export let data: PageServerData

  const trpc = getContextClient()
  const statusQuery = createSystemStatusQuery(trpc)
</script>

{#if $statusQuery.data}
  {@const status = $statusQuery.data}
  <LastFmConfig data={data.lastFmForm} {status} />
  <SlskConfig data={data.slskForm} {status} />
  <SoundcloudConfig data={data.soundcloudForm} {status} />
  <SpotifyConfig data={data.spotifyForm} {status} />
{:else if $statusQuery.error}
  <p>Failed to load system status</p>
{:else}
  <p>Loading...</p>
{/if}
