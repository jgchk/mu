<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { SOURCES, TRIGGERS } from 'svelte-dnd-action'
  import type { DndEvent } from 'svelte-dnd-action'
  import { flip } from 'svelte/animate'
  import { superForm } from 'sveltekit-superforms/client'
  import { isDefined } from 'utils'

  import { dnd } from '$lib/actions/dnd'
  import Button from '$lib/atoms/Button.svelte'
  import FileDrop from '$lib/atoms/FileDrop.svelte'
  import IconButton from '$lib/atoms/IconButton.svelte'
  import Input from '$lib/atoms/Input.svelte'
  import ArtistSelect from '$lib/components/ArtistSelect.svelte'
  import { getContextDialogs } from '$lib/dialogs/dialogs'
  import DeleteIcon from '$lib/icons/DeleteIcon.svelte'
  import SearchIcon from '$lib/icons/SearchIcon.svelte'
  import SelectorIcon from '$lib/icons/SelectorIcon.svelte'
  import { fetchArtistQuery } from '$lib/services/artists'
  import { formErrors } from '$lib/strings'
  import { getContextToast } from '$lib/toast/toast'
  import { getContextClient } from '$lib/trpc'
  import { cn } from '$lib/utils/classes'
  import type { StoreType } from '$lib/utils/svelte'

  import type { PageServerData } from '../../routes/(logged-in)/library/releases/[id]/edit/$types'
  import CoverArt from './CoverArt.svelte'
  import type { AlbumArt } from './ReleaseForm'

  export let formData: PageServerData['form']
  export let artUrl: string | undefined

  let albumArt: AlbumArt = artUrl === undefined ? { kind: 'none' } : { kind: 'default' }
  let dragDisabled = true

  const dispatch = createEventDispatcher<{
    success: { data: StoreType<typeof form> }
    failure: { reason: unknown }
    error: { error: unknown }
  }>()

  const toast = getContextToast()
  const dialogs = getContextDialogs()
  const trpc = getContextClient()

  const { form, enhance, errors, constraints, delayed } = superForm(formData, {
    dataType: 'json',
    onSubmit: (event) => {
      if (albumArt.kind === 'upload') {
        event.formData.append('albumArt', albumArt.data)
      } else {
        event.formData.append('albumArt', JSON.stringify(albumArt))
      }
    },
    onResult: ({ result }) => {
      if (result.type === 'redirect' || result.type === 'success') {
        dispatch('success', { data: $form })
      } else if (result.type === 'failure') {
        if (result.data?.reason) {
          dispatch('failure', { reason: result.data.reason })
        } else {
          toast.error(formErrors())
        }
      } else if (result.type === 'error') {
        dispatch('error', { error: result.error })
      }
    },
  })

  // --- Utility Functions ---

  const removeIfUnused = (artist: StoreType<typeof form>['album']['artists'][number]) => {
    if (artist?.action !== 'create') return

    const artist_ = artist

    const isUsedElsewhere =
      $form.album.artists.some(
        (artist) => artist?.action === 'create' && artist.id === artist_.id
      ) ||
      $form.tracks.some((track) =>
        track.artists.some((artist) => artist?.action === 'create' && artist.id === artist_.id)
      )

    if (!isUsedElsewhere) {
      $form.createArtists.delete(artist.id)
    }
  }

  const updateAlbumArtist = (
    newArtist: StoreType<typeof form>['album']['artists'][number],
    artistIndex: number
  ) => {
    const oldArtist = $form.album.artists[artistIndex]
    $form.album.artists[artistIndex] = newArtist
    removeIfUnused(oldArtist)
  }

  const updateTrackArtist = (
    newArtist: StoreType<typeof form>['album']['artists'][number],
    trackIndex: number,
    artistIndex: number
  ) => {
    const oldArtist = $form.tracks[trackIndex].artists[artistIndex]
    $form.tracks[trackIndex].artists[artistIndex] = newArtist
    removeIfUnused(oldArtist)
  }

  // --- Event Handlers ---

  const handleConsider = (
    e: CustomEvent<DndEvent<PageServerData['form']['data']['tracks'][number]>> & {
      target: EventTarget & HTMLDivElement
    }
  ) => {
    const {
      items: newItems,
      info: { source, trigger },
    } = e.detail
    $form.tracks = newItems
    // Ensure dragging is stopped on drag finish via keyboard
    if (source === SOURCES.KEYBOARD && trigger === TRIGGERS.DRAG_STOPPED) {
      dragDisabled = true
    }
  }
  const handleFinalize = (
    e: CustomEvent<DndEvent<PageServerData['form']['data']['tracks'][number]>> & {
      target: EventTarget & HTMLDivElement
    }
  ) => {
    const {
      items: newItems,
      info: { source },
    } = e.detail
    $form.tracks = newItems
    // Ensure dragging is stopped on drag finish via pointer (mouse, touch)
    if (source === SOURCES.POINTER) {
      dragDisabled = true
    }
  }
  const startDrag = (e: Event) => {
    e.preventDefault()
    dragDisabled = false
  }
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && dragDisabled) {
      dragDisabled = false
    }
  }

  const handleFileDrop = (e: CustomEvent<File[]>) => {
    const data = e.detail.at(0)
    if (data) {
      albumArt = { kind: 'upload', data }
    }
  }

  const handleSearchCoverArt = async () => {
    const queryParts = []
    if ($form.album.artists.length > 0) {
      const artistNames = await Promise.all(
        $form.album.artists
          .filter(isDefined)
          .map((artist) =>
            artist.action === 'create'
              ? $form.createArtists.get(artist.id)
              : fetchArtistQuery(trpc, artist.id).then((artist) => artist.name)
          )
      )
      const joinedArtistNames = artistNames.filter(isDefined).join(', ')
      queryParts.push(joinedArtistNames)
    }
    if ($form.album.title?.length) {
      queryParts.push($form.album.title)
    }
    const query = queryParts.join(' - ')
    dialogs.open('search-cover-art', {
      query,
      defaultArtUrl: artUrl,
      onSelect: (data) => {
        albumArt = { kind: 'upload', data }
      },
    })
  }
</script>

<div class="h-full overflow-auto">
  <form method="POST" use:enhance>
    <h2 class="mb-2 text-2xl font-bold">Release</h2>
    <div class="flex gap-4">
      <div class="flex flex-col items-center gap-1">
        <div class="h-64 w-64">
          {#if albumArt.kind === 'upload'}
            <button type="button" class="relative h-full w-full" on:click={handleSearchCoverArt}>
              <CoverArt src={URL.createObjectURL(albumArt.data)} alt="Album Art">
                <SearchIcon />
              </CoverArt>
            </button>
          {:else if albumArt.kind === 'none' || artUrl === undefined}
            <FileDrop class="h-full w-full" on:drop={(e) => handleFileDrop(e)} />
          {:else}
            <button type="button" class="relative h-full w-full" on:click={handleSearchCoverArt}>
              <CoverArt src={artUrl} alt="Album Art" on:error={() => (albumArt = { kind: 'none' })}>
                <SearchIcon />
              </CoverArt>
            </button>
          {/if}
        </div>
        <div class="flex gap-1">
          <Button on:click={handleSearchCoverArt}>Search</Button>
          <Button kind="outline" on:click={() => (albumArt = { kind: 'none' })}>Delete</Button>
        </div>
      </div>

      <div class="space-y-1">
        <Input
          bind:value={$form.album.title}
          errors={$errors.album?.title}
          {...$constraints.album?.title}
        />
        {#if $errors.album?.title}<span class="text-error-500">{$errors.album.title}</span>{/if}

        <div class="space-y-1">
          {#each $form.album.artists as artist, artistIndex}
            <div class="flex gap-1">
              <ArtistSelect
                value={artist}
                createArtists={$form.createArtists}
                on:create={({ detail }) => {
                  const id = $form.createArtists.size + 1
                  $form.createArtists.set(id, detail)
                  updateAlbumArtist(
                    {
                      action: 'create',
                      id,
                    },
                    artistIndex
                  )
                }}
                on:created={({ detail }) =>
                  updateAlbumArtist(
                    {
                      action: 'create',
                      id: detail,
                    },
                    artistIndex
                  )}
                on:connect={({ detail }) =>
                  updateAlbumArtist(
                    {
                      action: 'connect',
                      id: detail,
                    },
                    artistIndex
                  )}
              />
              <IconButton
                tooltip="Remove"
                kind="text"
                on:click={() => {
                  $form.album.artists = $form.album.artists.filter((artist_) => artist_ !== artist)
                  removeIfUnused(artist)
                }}
              >
                <DeleteIcon />
              </IconButton>
            </div>
          {/each}

          <Button
            kind="outline"
            on:click={() => ($form.album.artists = [...$form.album.artists, undefined])}
          >
            Add Artist
          </Button>
        </div>
      </div>
    </div>

    <h2 class="mb-2 mt-8 text-2xl font-bold">Tracks</h2>
    <div
      class="space-y-2"
      use:dnd={{ items: $form.tracks, dragDisabled }}
      on:consider={handleConsider}
      on:finalize={handleFinalize}
    >
      {#each $form.tracks as track, trackIndex (track.id)}
        <div
          class="group/track flex items-center rounded bg-gray-900 p-4 pl-0"
          animate:flip={{ duration: dnd.defaults.flipDurationMs }}
        >
          <button
            type="button"
            class={cn(
              'center mx-2 w-8 rounded py-1 text-gray-500 transition hover:bg-gray-800 hover:text-white',
              dragDisabled ? 'cursor-grab' : 'cursor-grabbing'
            )}
            tabindex={dragDisabled ? 0 : -1}
            aria-label="drag-handle"
            on:mousedown={startDrag}
            on:touchstart={startDrag}
            on:keydown={handleKeyDown}
          >
            <span class="group-hover/track:hidden">{trackIndex + 1}</span>
            <SelectorIcon class="hidden h-6 group-hover/track:block" />
          </button>
          <div class="flex-1 space-y-1">
            <Input
              bind:value={track.title}
              errors={$errors.tracks?.[trackIndex]?.title}
              {...$constraints.tracks?.title}
            />
            {#if $errors.tracks?.[trackIndex]?.title}
              <span class="text-error-500">
                {$errors.tracks?.[trackIndex]?.title}
              </span>
            {/if}

            <div class="space-y-1">
              {#each track.artists as artist, artistIndex}
                <div class="flex gap-1">
                  <ArtistSelect
                    value={artist}
                    createArtists={$form.createArtists}
                    on:create={({ detail }) => {
                      const id = $form.createArtists.size + 1
                      $form.createArtists.set(id, detail)
                      updateTrackArtist({ action: 'create', id }, trackIndex, artistIndex)
                    }}
                    on:created={({ detail }) =>
                      updateTrackArtist(
                        {
                          action: 'create',
                          id: detail,
                        },
                        trackIndex,
                        artistIndex
                      )}
                    on:connect={({ detail }) =>
                      updateTrackArtist(
                        {
                          action: 'connect',
                          id: detail,
                        },
                        trackIndex,
                        artistIndex
                      )}
                  />
                  <IconButton
                    tooltip="Remove"
                    kind="text"
                    on:click={() => {
                      track.artists = track.artists.filter((artist_) => artist_ !== artist)
                      removeIfUnused(artist)
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </div>
              {/each}

              <Button
                kind="outline"
                on:click={() => (track.artists = [...track.artists, undefined])}
              >
                Add Artist
              </Button>
            </div>
          </div>
        </div>
      {/each}
    </div>

    <Button type="submit" kind="solid" loading={$delayed} class="mt-4">Submit</Button>
  </form>
</div>
