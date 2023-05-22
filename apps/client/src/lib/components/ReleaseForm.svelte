<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import type { DndEvent } from 'svelte-dnd-action'
  import { flip } from 'svelte/animate'
  import { superForm } from 'sveltekit-superforms/client'

  import { dnd } from '$lib/actions/dnd'
  import Button from '$lib/atoms/Button.svelte'
  import FileDrop from '$lib/atoms/FileDrop.svelte'
  import IconButton from '$lib/atoms/IconButton.svelte'
  import Input from '$lib/atoms/Input.svelte'
  import ArtistSelect from '$lib/components/ArtistSelect.svelte'
  import DeleteIcon from '$lib/icons/DeleteIcon.svelte'
  import { formErrors } from '$lib/strings'
  import { getContextToast } from '$lib/toast/toast'
  import type { StoreType } from '$lib/utils/svelte'

  import type { PageServerData } from '../../routes/(logged-in)/(library)/releases/[id]/edit/$types'
  import CoverArt from './CoverArt.svelte'

  export let formData: PageServerData['form']
  export let artUrl: string | undefined

  const dispatch = createEventDispatcher<{
    success: { data: StoreType<typeof form> }
    failure: { reason: unknown }
    error: { error: unknown }
  }>()

  const toast = getContextToast()
  const { form, enhance, errors, constraints, delayed } = superForm(formData, {
    dataType: 'json',
    onSubmit: (event) => {
      if (albumArt) {
        event.formData.append('albumArt', albumArt)
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

  let albumArt: Blob | null | undefined = artUrl === undefined ? null : undefined

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

  const handleReorderTracks = (
    e: CustomEvent<DndEvent<PageServerData['form']['data']['tracks'][number]>> & {
      target: EventTarget & HTMLDivElement
    }
  ) => {
    $form.tracks = e.detail.items
  }

  const handleFileDrop = (e: CustomEvent<File[]>) => {
    albumArt = e.detail.at(0)
  }
</script>

<div class="h-full overflow-auto">
  <form method="POST" use:enhance>
    <h2 class="mb-2 text-2xl font-bold">Release</h2>
    <div class="flex gap-4">
      <div class="h-64 w-64">
        {#if albumArt}
          <button
            type="button"
            class="relative h-full w-full shadow"
            on:click={() => (albumArt = null)}
          >
            <CoverArt src={URL.createObjectURL(albumArt)} alt="Album Art">
              <DeleteIcon />
            </CoverArt>
          </button>
        {:else if albumArt === null || artUrl === undefined}
          <FileDrop class="h-full w-full" on:drop={(e) => handleFileDrop(e)} />
        {:else}
          <button
            type="button"
            class="relative h-full w-full shadow"
            on:click={() => (albumArt = null)}
          >
            <CoverArt src={artUrl} alt="Album Art" on:error={() => (albumArt = null)}>
              <DeleteIcon />
            </CoverArt>
          </button>
        {/if}
      </div>

      <div class="space-y-1">
        <Input
          bind:value={$form.album.title}
          errors={$errors.album?.title}
          {...$constraints.album?.title}
        />
        {#if $errors.album?.title}<span class="text-error-500">{$errors.album.title}</span>{/if}

        <div class="space-y-1">
          {#each $form.album.artists as artist}
            <div class="flex gap-1">
              <ArtistSelect
                value={artist}
                createArtists={$form.createArtists}
                on:create={({ detail }) => {
                  const id = $form.createArtists.size + 1
                  $form.createArtists.set(id, detail)
                  artist = {
                    action: 'create',
                    id,
                  }
                  removeIfUnused(artist)
                }}
                on:created={({ detail }) => {
                  artist = {
                    action: 'create',
                    id: detail,
                  }
                  removeIfUnused(artist)
                }}
                on:connect={({ detail }) => {
                  artist = {
                    action: 'connect',
                    id: detail,
                  }
                  removeIfUnused(artist)
                }}
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
      use:dnd={{ items: $form.tracks }}
      on:consider={handleReorderTracks}
      on:finalize={handleReorderTracks}
    >
      {#each $form.tracks as track, i (track.id)}
        <div
          class="flex items-center rounded bg-gray-900 p-4 pl-0"
          animate:flip={{ duration: dnd.defaults.flipDurationMs }}
        >
          <div class="center w-12 text-gray-500">{i + 1}</div>
          <div class="flex-1 space-y-1">
            <Input
              bind:value={track.title}
              errors={$errors.tracks?.[i]?.title}
              {...$constraints.tracks?.title}
            />
            {#if $errors.tracks?.[i]?.title}
              <span class="text-error-500">
                {$errors.tracks?.[i]?.title}
              </span>
            {/if}

            <div class="space-y-1">
              {#each track.artists as artist}
                <div class="flex gap-1">
                  <ArtistSelect
                    value={artist}
                    createArtists={$form.createArtists}
                    on:create={({ detail }) => {
                      const id = $form.createArtists.size + 1
                      $form.createArtists.set(id, detail)
                      artist = {
                        action: 'create',
                        id,
                      }
                      removeIfUnused(artist)
                    }}
                    on:created={({ detail }) => {
                      artist = {
                        action: 'create',
                        id: detail,
                      }
                      removeIfUnused(artist)
                    }}
                    on:connect={({ detail }) => {
                      artist = {
                        action: 'connect',
                        id: detail,
                      }
                      removeIfUnused(artist)
                    }}
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
