<script lang="ts">
  import { createAllDownloadsQuery } from '$lib/services/downloads'
  import { getContextClient } from '$lib/trpc'

  import GroupDownload from './GroupDownload.svelte'
  import TrackDownload from './TrackDownload.svelte'

  const trpc = getContextClient()
  const downloadsQuery = createAllDownloadsQuery(trpc)
</script>

<div class="p-4">
  {#if $downloadsQuery.data}
    {#if $downloadsQuery.data.groups.length > 0 || $downloadsQuery.data.tracks.length > 0}
      <div class="space-y-4">
        {#each $downloadsQuery.data.groups as releaseDownload (`${releaseDownload.service}-${releaseDownload.id}`)}
          <GroupDownload download={releaseDownload} />
        {/each}
        {#each $downloadsQuery.data.tracks as trackDownload (`${trackDownload.service}-${trackDownload.id}`)}
          <TrackDownload download={trackDownload} />
        {/each}
      </div>
    {:else}
      No downloads
    {/if}
  {:else if $downloadsQuery.error}
    <div>{$downloadsQuery.error.message}</div>
  {:else}
    <div>Loading...</div>
  {/if}
</div>
