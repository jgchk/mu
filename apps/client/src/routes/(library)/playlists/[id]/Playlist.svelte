<script lang="ts">
  import { decode } from 'bool-lang'

  import Button from '$lib/atoms/Button.svelte'
  import EditTagsFilterPlaintext from '$lib/components/EditTagsFilterPlaintext.svelte'
  import TrackList from '$lib/components/TrackList.svelte'
  import { makeCollageUrl, makeImageUrl } from '$lib/cover-art'
  import { getContextDialogs } from '$lib/dialogs/dialogs'
  import { playTrack } from '$lib/now-playing'
  import {
    createEditPlaylistTrackOrderMutation,
    createRemoveTrackFromPlaylistMutation,
  } from '$lib/services/playlists'
  import { createFavoriteTrackMutation } from '$lib/services/tracks'
  import { getContextClient } from '$lib/trpc'
  import type { RouterInput, RouterOutput } from '$lib/trpc'

  import Header from '../../Header.svelte'

  export let playlist: RouterOutput['playlists']['get']
  export let tracks: RouterOutput['playlists']['tracks']
  export let tracksQuery: RouterInput['playlists']['tracks']

  const dialogs = getContextDialogs()

  const makeQueueData = (trackIndex: number) => ({
    previousTracks: tracks.slice(0, trackIndex).map((t) => t.id),
    nextTracks: tracks.slice(trackIndex + 1).map((t) => t.id),
  })

  const trpc = getContextClient()
  const editTrackOrderMutation = createEditPlaylistTrackOrderMutation(trpc)
  $: favoriteMutation = createFavoriteTrackMutation(trpc, {
    getPlaylistTracksQuery: tracksQuery,
  })

  const removeTrackMutation = createRemoveTrackFromPlaylistMutation(trpc)
  const handleRemoveTrack = (playlistTrackId: number) =>
    $removeTrackMutation.mutate({ playlistId: playlist.id, playlistTrackId })
</script>

<div class="space-y-4">
  <Header
    title={playlist.name}
    coverArtSrc={playlist.imageId !== null
      ? makeImageUrl(playlist.imageId, { size: 512 })
      : makeCollageUrl(playlist.imageIds, { size: 512 })}
    coverArtClickable={tracks.length > 0}
  >
    <svelte:fragment slot="cover-art-icon">
      {#if playlist.filter !== null}
        <div
          class="bg-secondary-600 border-secondary-700 absolute bottom-0 right-0 ml-auto rounded-br rounded-tl border-l border-t border-opacity-75 bg-opacity-75 pb-[3px] pl-[5px] pr-[7px] pt-[1px] text-sm font-semibold italic text-white"
        >
          Auto
        </div>
      {/if}
    </svelte:fragment>

    <svelte:fragment slot="subtitle">
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
    </svelte:fragment>

    <svelte:fragment slot="buttons">
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
    </svelte:fragment>
  </Header>

  <TrackList
    {tracks}
    favorites={tracksQuery.favorite ?? false}
    sortable
    reorderable={playlist.filter === null &&
      !tracksQuery.sort &&
      !$editTrackOrderMutation.isLoading}
    on:play={(e) => playTrack(e.detail.track.id, makeQueueData(e.detail.i))}
    on:favorite={(e) =>
      $favoriteMutation.mutate({ id: e.detail.track.id, favorite: !e.detail.favorite })}
    on:delete={(e) =>
      e.detail.track.playlistTrackId !== undefined &&
      handleRemoveTrack(e.detail.track.playlistTrackId)}
    on:reorder={(e) => {
      const previousTracks = [...tracks]
      $editTrackOrderMutation.mutate(
        {
          playlistId: playlist.id,
          trackIds: e.detail.tracks.map((t) => t.id),
        },
        {
          onError: () => {
            tracks = previousTracks
          },
        }
      )
    }}
  />
</div>
