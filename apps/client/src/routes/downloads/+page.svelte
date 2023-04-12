<script lang="ts">
  import { getContextClient } from '$lib/trpc'
  import { compareDates } from '$lib/utils/date'

  import GroupDownload from './GroupDownload.svelte'
  import TrackDownload from './TrackDownload.svelte'
  import type {
    GroupDownload as GroupDownloadType,
    TrackDownload as TrackDownloadType,
  } from './types'

  const trpc = getContextClient()
  const downloadsQuery = trpc.downloads.getAll.query(undefined, { refetchInterval: 1000 })

  let downloads:
    | {
        groups: (GroupDownloadType & { tracks: TrackDownloadType[] })[]
        tracks: TrackDownloadType[]
      }
    | undefined
  $: {
    if (!$downloadsQuery.data) {
      downloads = undefined
    } else {
      const data: {
        groups: { [id: string]: GroupDownloadType & { tracks: TrackDownloadType[] } }
        tracks: TrackDownloadType[]
      } = {
        groups: Object.fromEntries(
          $downloadsQuery.data.groups.map((group) => [
            `${group.service}-${group.id}`,
            { ...group, tracks: [] },
          ])
        ),
        tracks: [],
      }

      for (const track of $downloadsQuery.data.tracks) {
        if (track.parentId === null) {
          data.tracks.push(track)
        } else {
          data.groups[`${track.service}-${track.parentId}`].tracks.push(track)
        }
      }

      downloads = {
        groups: Object.values(data.groups).sort((a, b) => compareDates(a.createdAt, b.createdAt)),
        tracks: data.tracks,
      }
    }
  }
</script>

<div class="p-4">
  {#if downloads}
    {#if downloads.groups.length > 0 || downloads.tracks.length > 0}
      <div class="space-y-4">
        {#each downloads.groups as releaseDownload (`${releaseDownload.service}-${releaseDownload.id}`)}
          <GroupDownload download={releaseDownload} />
        {/each}
        {#each downloads.tracks as trackDownload (`${trackDownload.service}-${trackDownload.id}`)}
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
