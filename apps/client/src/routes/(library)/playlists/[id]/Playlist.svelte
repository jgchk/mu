<script lang="ts">
  import { decode } from 'bool-lang'

  import Button from '$lib/atoms/Button.svelte'
  import CoverArt from '$lib/components/CoverArt.svelte'
  import EditTagsFilterPlaintext from '$lib/components/EditTagsFilterPlaintext.svelte'
  import { makeCollageUrl, makeImageUrl } from '$lib/cover-art'
  import { getContextDialogs } from '$lib/dialogs/dialogs'
  import PlayIcon from '$lib/icons/PlayIcon.svelte'
  import { playTrack } from '$lib/now-playing'
  import type { RouterOutput } from '$lib/trpc'

  import PlaylistTracks from './PlaylistTracks.svelte'

  export let playlist: RouterOutput['playlists']['get']
  export let tracks: RouterOutput['playlists']['tracks']

  const dialogs = getContextDialogs()

  const makeQueueData = (trackIndex: number) => ({
    previousTracks: tracks.slice(0, trackIndex).map((t) => t.id),
    nextTracks: tracks.slice(trackIndex + 1).map((t) => t.id),
  })
</script>

<div class="space-y-4 p-4">
  <div class="relative flex items-end gap-6">
    <button
      type="button"
      disabled={tracks.length === 0}
      on:click={() => playTrack(tracks[0].id, makeQueueData(0))}
    >
      <div class="relative w-64 shrink-0">
        <CoverArt
          src={playlist.imageId !== null
            ? makeImageUrl(playlist.imageId, { size: 512 })
            : makeCollageUrl(playlist.imageIds, { size: 512 })}
          alt={playlist.name}
          iconClass="w-16 h-16"
          hoverable={tracks.length > 0}
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
      {#if playlist.filter !== null}
        <div class="w-fit rounded bg-gray-900 px-2 py-1 text-sm">
          <EditTagsFilterPlaintext filter={decode(playlist.filter)} tagClass="text-gray-300" />
        </div>
      {/if}
    </div>

    <div class="absolute right-0 top-0 flex gap-1">
      <Button kind="text" on:click={() => dialogs.open('delete-playlist', { playlist })}>
        Delete
      </Button>
      <Button
        kind="outline"
        on:click={() => {
          if (playlist.filter !== null) {
            dialogs.open('edit-auto-playlist', {
              playlist: { ...playlist, filter: playlist.filter },
            })
          } else {
            dialogs.open('edit-playlist', { playlist })
          }
        }}
      >
        Edit
      </Button>
    </div>
  </div>

  <PlaylistTracks
    playlistId={playlist.id}
    {tracks}
    reorderable={playlist.filter === null}
    on:play={(e) => playTrack(e.detail.id, makeQueueData(e.detail.index))}
  />
</div>
