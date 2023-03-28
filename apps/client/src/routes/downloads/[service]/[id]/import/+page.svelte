<script lang="ts">
  import type { Readable } from 'svelte/store'
  import type { DndEvent } from 'svelte-dnd-action'
  import { dndzone } from 'svelte-dnd-action'
  import { superForm } from 'sveltekit-superforms/client'

  import { dev } from '$app/environment'
  import Button from '$lib/atoms/Button.svelte'
  import IconButton from '$lib/atoms/IconButton.svelte'
  import Input from '$lib/atoms/Input.svelte'
  import DeleteIcon from '$lib/icons/DeleteIcon.svelte'
  import { getContextToast } from '$lib/toast/toast'
  import { cn } from '$lib/utils/classes'

  import type { PageServerData } from './$types'
  import ArtistSelect from './ArtistSelect.svelte'

  export let data: PageServerData

  const toast = getContextToast()
  const { form, enhance, errors, constraints, delayed } = superForm(data.form, {
    dataType: 'json',
    onResult: ({ result }) => {
      if (result.type === 'redirect' || result.type === 'success') {
        toast.success(`Imported ${$form.album.title || 'release'}!`)
      } else if (result.type === 'failure') {
        toast.error('Check the form for errors')
      } else if (result.type === 'error') {
        toast.error('Failed to import release')
      }
    },
  })

  type StoreType<T extends Readable<unknown>> = T extends Readable<infer U> ? U : never

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
      $form.artists.delete(artist.id)
    }
  }

  const handleReorderTracks = (
    e: CustomEvent<DndEvent<PageServerData['form']['data']['tracks'][number]>> & {
      target: EventTarget & HTMLDivElement
    }
  ) => {
    $form.tracks = e.detail.items.map((track, i) => ({ ...track, track: i + 1 }))
  }
</script>

<div class="mr-2 h-full overflow-auto">
  <form class={cn('p-4', dev && 'mb-8')} method="POST" use:enhance>
    <h2 class="mb-2 text-2xl font-bold">Release</h2>
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
              artists={$form.artists}
              on:create={({ detail }) => {
                const id = $form.artists.size + 1
                $form.artists.set(id, detail)
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

    <h2 class="mb-2 mt-8 text-2xl font-bold">Tracks</h2>
    <div
      class="space-y-2"
      use:dndzone={{ items: $form.tracks }}
      on:consider={(e) => ($form.tracks = e.detail.items)}
      on:finalize={handleReorderTracks}
    >
      {#each $form.tracks as track, i (track.id)}
        <div class="flex items-center rounded bg-gray-900 p-4 pl-0">
          <div class="center w-12 text-gray-500">{track.track}</div>
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
                    artists={$form.artists}
                    on:create={({ detail }) => {
                      const id = $form.artists.size + 1
                      $form.artists.set(id, detail)
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
  {#await import('./Debug.svelte')}
    <div class="absolute left-0 bottom-0 flex w-full justify-center p-1 text-gray-400">
      Loading Debug...
    </div>
  {:then Debug}
    <Debug.default data={$form} />
  {/await}
{/if}
