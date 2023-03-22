<script lang="ts">
  import { getContextClient } from '$lib/trpc';

  import ReleaseDownload from './ReleaseDownload.svelte';
  import ScPlaylistDownload from './ScPlaylistDownload.svelte';
  import ScTrackDownload from './ScTrackDownload.svelte';
  import TrackDownload from './TrackDownload.svelte';
  import type {
    ReleaseDownload as ReleaseDownloadType,
    SoundcloudPlaylistDownload,
    SoundcloudTrackDownload,
    TrackDownload as TrackDownloadType
  } from './types';

  const trpc = getContextClient();
  const downloadsQuery = trpc.downloads.getAll.query(undefined, { refetchInterval: 1000 });

  let downloads:
    | {
        releases: (ReleaseDownloadType & { tracks: TrackDownloadType[] })[];
        tracks: TrackDownloadType[];
        scPlaylists: (SoundcloudPlaylistDownload & { tracks: SoundcloudTrackDownload[] })[];
        scTracks: SoundcloudTrackDownload[];
      }
    | undefined;
  $: {
    if (!$downloadsQuery.data) {
      downloads = undefined;
    } else {
      const data: {
        releases: { [id: number]: ReleaseDownloadType & { tracks: TrackDownloadType[] } };
        tracks: TrackDownloadType[];
        scPlaylists: {
          [id: number]: SoundcloudPlaylistDownload & { tracks: SoundcloudTrackDownload[] };
        };
        scTracks: SoundcloudTrackDownload[];
      } = {
        releases: Object.fromEntries(
          $downloadsQuery.data.releases.map((release) => [release.id, { ...release, tracks: [] }])
        ),
        tracks: [],
        scPlaylists: Object.fromEntries(
          $downloadsQuery.data.scPlaylists.map((playlist) => [
            playlist.id,
            { ...playlist, tracks: [] }
          ])
        ),
        scTracks: []
      };

      for (const track of $downloadsQuery.data.tracks) {
        if (track.releaseDownloadId === null) {
          data.tracks.push(track);
        } else {
          data.releases[track.releaseDownloadId].tracks.push(track);
        }
      }

      for (const track of $downloadsQuery.data.scTracks) {
        if (track.playlistDownloadId === null) {
          data.scTracks.push(track);
        } else {
          data.scPlaylists[track.playlistDownloadId].tracks.push(track);
        }
      }

      downloads = {
        releases: Object.values(data.releases),
        tracks: data.tracks,
        scPlaylists: Object.values(data.scPlaylists),
        scTracks: data.scTracks
      };
    }
  }
</script>

{#if downloads}
  <h2 class="mt-8 text-2xl font-bold">Soundcloud</h2>
  <div class="grid w-fit grid-cols-4 gap-x-3">
    {#each downloads.scPlaylists as releaseDownload (releaseDownload.id)}
      <ScPlaylistDownload download={releaseDownload} />
    {/each}
    {#each downloads.scTracks as trackDownload (trackDownload.id)}
      <ScTrackDownload download={trackDownload} />
    {/each}
  </div>

  {#if downloads.releases.length > 0 || downloads.tracks.length > 0}
    <h2 class="mt-8 text-2xl font-bold">Old Format</h2>
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
