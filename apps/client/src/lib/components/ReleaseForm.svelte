<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte'
  import type { DndEvent } from 'svelte-dnd-action'
  import { superForm } from 'sveltekit-superforms/client'
  import { base64ToBlob } from 'utils/browser'

  import { dev } from '$app/environment'
  import { dnd } from '$lib/actions/dnd'
  import Button from '$lib/atoms/Button.svelte'
  import FileDrop from '$lib/atoms/FileDrop.svelte'
  import IconButton from '$lib/atoms/IconButton.svelte'
  import Input from '$lib/atoms/Input.svelte'
  import ArtistSelect from '$lib/components/ArtistSelect.svelte'
  import DeleteIcon from '$lib/icons/DeleteIcon.svelte'
  import { formErrors } from '$lib/strings'
  import { getContextToast } from '$lib/toast/toast'
  import { cn } from '$lib/utils/classes'
  import type { StoreType } from '$lib/utils/svelte'

  import type { PageServerData } from '../../routes/releases/[id]/edit/$types'
  import CoverArt from './CoverArt.svelte'

  export let formData: PageServerData['form']
  export let artData: PageServerData['art']

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
        event.data.append('albumArt', albumArt)
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

  let albumArt: Blob | undefined = undefined
  onMount(() => {
    if (artData) {
      albumArt = base64ToBlob(artData)
    } else {
      albumArt = undefined
    }
  })

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
    $form.tracks = e.detail.items.map((track, i) => ({ ...track, track: i + 1 }))
  }

  const handleFileDrop = (e: CustomEvent<File[]>) => {
    albumArt = e.detail.at(0)
  }
</script>

<div class="h-full overflow-auto">
  <form class={cn('p-4', dev && 'mb-8')} method="POST" use:enhance>
    <h2 class="mb-2 text-2xl font-bold">Release</h2>
    <div class="flex gap-4">
      <div class="h-64 w-64">
        {#if albumArt}
          <button
            type="button"
            class="relative h-full w-full shadow"
            on:click={() => (albumArt = undefined)}
          >
            <CoverArt src={URL.createObjectURL(albumArt)} alt="Album Art">
              <DeleteIcon />
            </CoverArt>
          </button>
        {:else}
          <FileDrop class="h-full w-full" on:drop={(e) => handleFileDrop(e)} />
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
      on:consider={(e) => ($form.tracks = e.detail.items)}
      on:finalize={handleReorderTracks}
    >
      {#each $form.tracks as track, i (track.id)}
        <div class="flex items-center rounded bg-gray-900 p-4 pl-0">
          <div class="center w-12 text-gray-500">{track.track ?? ''}</div>
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

{#if dev}
  {#await import('$lib/components/SuperformDebug.svelte')}
    <div class="absolute bottom-0 left-0 flex w-full justify-center p-1 text-gray-400">
      Loading Debug...
    </div>
  {:then Debug}
    <Debug.default data={$form} />
  {/await}
{/if}
