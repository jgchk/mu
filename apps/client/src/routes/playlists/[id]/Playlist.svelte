<script lang="ts">
  import { isNotNull } from 'utils'

  import Button from '$lib/atoms/Button.svelte'
  import CoverArt from '$lib/components/CoverArt.svelte'
  import { makeCollageUrl, makeImageUrl } from '$lib/cover-art'
  import { getContextDialogs } from '$lib/dialogs/dialogs'
  import PlayIcon from '$lib/icons/PlayIcon.svelte'
  import { playTrack } from '$lib/now-playing'
  import type { RouterOutput } from '$lib/trpc'

  import PlaylistTracks from './PlaylistTracks.svelte'

  export let playlist: RouterOutput['playlists']['getWithTracks']

  const dialogs = getContextDialogs()

  const makeQueueData = (
    playlist: RouterOutput['playlists']['getWithTracks'],
    trackIndex: number
  ) => ({
    previousTracks: playlist.tracks.slice(0, trackIndex).map((t) => t.id),
    nextTracks: playlist.tracks.slice(trackIndex + 1).map((t) => t.id),
  })

  function makePlaylistCollageUrl() {
    const imageIds = playlist.tracks.map((t) => t.imageId).filter(isNotNull)
    return makeCollageUrl(imageIds, { size: 512 })
  }
</script>

<div class="space-y-4 p-4">
  <div class="relative flex items-end gap-6">
    <button
      type="button"
      disabled={playlist.tracks.length === 0}
      on:click={() => playTrack(playlist.tracks[0].id, makeQueueData(playlist, 0))}
    >
      <div class="relative w-64 shrink-0">
        <CoverArt
          src={playlist.imageId !== null
            ? makeImageUrl(playlist.imageId, { size: 512 })
            : makePlaylistCollageUrl()}
          alt={playlist.name}
          iconClass="w-16 h-16"
          hoverable={playlist.tracks.length > 0}
        >
          <PlayIcon />
        </CoverArt>
      </div>
    </button>

    <div class="space-y-1 pb-2">
      <h1
        class="mr-11 line-clamp-2 break-all text-6xl font-bold leading-[1.19]"
        title={playlist.name}
      >
        {playlist.name}
      </h1>
      {#if playlist.description}
        <p
          class="line-clamp-5 whitespace-pre-wrap leading-[1.19] text-gray-400"
          title={playlist.description}
        >
          {playlist.description}
        </p>
      {/if}
    </div>

    <div class="absolute right-0 top-0 flex gap-1">
      <Button kind="text" on:click={() => dialogs.open('delete-playlist', { playlist })}>
        Delete
      </Button>
      <Button kind="outline" on:click={() => dialogs.open('edit-playlist', { playlist })}>
        Edit
      </Button>
    </div>
  </div>

  <PlaylistTracks
    playlistId={playlist.id}
    tracks={playlist.tracks}
    on:play={(e) => playTrack(e.detail.id, makeQueueData(playlist, e.detail.index))}
  />
</div>
