<script lang="ts">
  import { getContextClient } from '$lib/trpc'

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
        groups: Object.values(data.groups),
        tracks: data.tracks,
      }
    }
  }
</script>

{#if downloads}
  <h2 class="mt-2 text-2xl font-bold">Groups</h2>
  <div class="grid w-fit grid-cols-4 gap-x-3">
    {#each downloads.groups as releaseDownload (releaseDownload.id)}
      <GroupDownload download={releaseDownload} />
    {/each}
  </div>

  <h2 class="mt-8 text-2xl font-bold">Tracks</h2>
  <div class="grid w-fit grid-cols-4 gap-x-3">
    {#each downloads.tracks as trackDownload (trackDownload.id)}
      <TrackDownload download={trackDownload} />
    {/each}
  </div>
{:else if $downloadsQuery.error}
  <div>{$downloadsQuery.error.message}</div>
{:else}
  <div>Loading...</div>
{/if}
