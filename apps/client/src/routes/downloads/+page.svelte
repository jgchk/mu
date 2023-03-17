<script lang="ts">
  import { getContextClient } from '$lib/trpc'
  import type {
    ReleaseDownload as ReleaseDownloadType,
    TrackDownload as TrackDownloadType,
  } from './types'
  import ReleaseDownload from './ReleaseDownload.svelte'
  import TrackDownload from './TrackDownload.svelte'

  const trpc = getContextClient()
  const downloadsQuery = trpc.downloads.getAll.query(undefined, { refetchInterval: 1000 })

  let downloads:
    | {
        releases: (ReleaseDownloadType & { tracks: TrackDownloadType[] })[]
        tracks: TrackDownloadType[]
      }
    | undefined
  $: {
    if (!$downloadsQuery.data) {
      downloads = undefined
    } else {
      const data: {
        releases: { [id: number]: ReleaseDownloadType & { tracks: TrackDownloadType[] } }
        tracks: TrackDownloadType[]
      } = {
        releases: Object.fromEntries(
          $downloadsQuery.data.releases.map((release) => [release.id, { ...release, tracks: [] }])
        ),
        tracks: [],
      }

      for (const track of $downloadsQuery.data.tracks) {
        if (track.releaseDownloadId === null) {
          data.tracks.push(track)
        } else {
          data.releases[track.releaseDownloadId].tracks.push(track)
        }
      }

      downloads = {
        releases: Object.values(data.releases),
        tracks: data.tracks,
      }
    }
  }
</script>

{#if downloads}
  {#if downloads.releases.length > 0 || downloads.tracks.length > 0}
    <div class="grid w-fit grid-cols-4 gap-x-3">
      {#each downloads.releases as releaseDownload (releaseDownload.id)}
        <ReleaseDownload download={releaseDownload} />
      {/each}
      {#each downloads.tracks as trackDownload (trackDownload.id)}
        <TrackDownload download={trackDownload} />
      {/each}
    </div>
  {:else}
    <div>No downloads</div>
  {/if}
{:else if $downloadsQuery.error}
  <div>{$downloadsQuery.error.message}</div>
{:else}
  <div>Loading...</div>
{/if}
