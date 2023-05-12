<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { fade } from 'svelte/transition'

  import type { PopperTooltipAction } from '$lib/actions/popper'
  import { tooltip } from '$lib/actions/tooltip'
  import Button from '$lib/atoms/Button.svelte'
  import Delay from '$lib/atoms/Delay.svelte'
  import Input from '$lib/atoms/Input.svelte'
  import Loader from '$lib/atoms/Loader.svelte'
  import { getContextDialogs } from '$lib/dialogs/dialogs'
  import {
    createAddTrackToPlaylistMutation,
    createPlaylistsHasTrackQuery,
  } from '$lib/services/playlists'
  import { getContextToast } from '$lib/toast/toast'
  import type { RouterOutput } from '$lib/trpc'
  import { getContextClient } from '$lib/trpc'
  import { tw } from '$lib/utils/classes'

  import LinkToast from './LinkToast.svelte'
  import PopoverArrow from './PopoverArrow.svelte'

  export let trackId: number
  export let popperTooltip: PopperTooltipAction
  let class_: string | undefined = undefined
  export { class_ as class }
  export let excludePlaylistId: number | undefined = undefined
  export let id: string | undefined = undefined

  const trpc = getContextClient()
  const playlistsQuery = createPlaylistsHasTrackQuery(trpc, trackId)
  const addToPlaylistMutation = createAddTrackToPlaylistMutation(trpc)

  const dialogs = getContextDialogs()
  const toast = getContextToast()

  const handleNewPlaylist = () => {
    dialogs.open('new-playlist', { name: filter, tracks: [trackId] })
    close()
  }

  let addingToPlaylistId: number | undefined = undefined
  const handleAddToPlaylist = (playlistId: number, playlistName: string) => {
    if ($addToPlaylistMutation.isLoading) return

    addingToPlaylistId = playlistId

    $addToPlaylistMutation.mutate(
      { playlistId, trackId },
      {
        onSuccess: () => {
          toast.success(LinkToast, {
            props: {
              message: ['Added to ', { href: `/playlists/${playlistId}`, text: playlistName }, '!'],
            },
          })
          addingToPlaylistId = undefined
          close()
        },
        onError: () => {
          addingToPlaylistId = undefined
        },
      }
    )
  }

  const dispatch = createEventDispatcher<{ close: undefined }>()
  const close = () => dispatch('close')

  let filter = ''
  let filteredPlaylists: RouterOutput['playlists']['getAllHasTrack'] | undefined = undefined
  $: {
    const playlists = $playlistsQuery.data
    if (playlists) {
      filteredPlaylists = playlists.filter((p) =>
        p.name.toLowerCase().includes(filter.toLowerCase())
      )
      if (excludePlaylistId !== undefined) {
        filteredPlaylists = playlists.filter((p) => p.id !== excludePlaylistId)
      }
    } else {
      filteredPlaylists = undefined
    }
  }
</script>

<div
  {id}
  class={tw('z-40 w-full max-w-xs rounded-lg border border-gray-600 bg-gray-700 shadow-lg', class_)}
  use:popperTooltip={{ modifiers: [{ name: 'offset', options: { offset: [0, 8] } }] }}
  transition:fade|local={{ duration: 75 }}
>
  <PopoverArrow />

  <div class="m-2 mb-0">
    <Input
      class="w-full"
      layer={700}
      bind:value={filter}
      autofocus
      placeholder="Find a playlist..."
      on:keydown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          if (filteredPlaylists?.length) {
            void handleAddToPlaylist(filteredPlaylists[0].id, filteredPlaylists[0].name)
          } else {
            void handleNewPlaylist()
          }
        }
      }}
    />
  </div>

  <div class="max-h-[calc(100vh/3)] overflow-auto p-2" tabindex="-1">
    <Button
      kind="text"
      class="w-full text-white"
      layer={700}
      align="left"
      on:click={handleNewPlaylist}
    >
      New Playlist
    </Button>
    {#if filteredPlaylists}
      {#each filteredPlaylists as playlist (playlist.id)}
        <Button
          kind="text"
          class="w-full text-white"
          layer={700}
          align="left"
          on:click={() => {
            if (playlist.hasTrack) {
              dialogs.open('confirm-duplicate-playlist-track', {
                playlistId: playlist.id,
                trackId,
                playlistName: playlist.name,
              })
            } else {
              handleAddToPlaylist(playlist.id, playlist.name)
            }
          }}
          loading={addingToPlaylistId === playlist.id}
        >
          <div class="flex w-full items-center justify-between">
            <div>{playlist.name}</div>
            {#if playlist.hasTrack}
              <div class="text-error-500 text-xs">Already added</div>
            {/if}
          </div>
        </Button>
      {/each}
    {:else if $playlistsQuery.error}
      <Button
        kind="text"
        class="w-full text-white"
        layer={700}
        align="left"
        on:click={() => $playlistsQuery.refetch()}
        loading={$playlistsQuery.isFetching}
      >
        <span class="text-error-500" use:tooltip={{ content: $playlistsQuery.error.message }}
          >Error</span
        > loading playlists. Retry?
      </Button>
    {:else}
      <div class="flex h-7 w-full items-center justify-center">
        <Delay>
          <Loader class="h-5 w-5 text-gray-500" />
        </Delay>
      </div>
    {/if}
  </div>
</div>

<svelte:window
  on:keydown={(e) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      close()
    }
  }}
/>
