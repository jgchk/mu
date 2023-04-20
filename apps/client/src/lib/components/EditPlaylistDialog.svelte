<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { ifDefined } from 'utils'
  import { blobToBase64 } from 'utils/browser'

  import Button from '$lib/atoms/Button.svelte'
  import Dialog from '$lib/atoms/Dialog.svelte'
  import FileDrop from '$lib/atoms/FileDrop.svelte'
  import Input from '$lib/atoms/Input.svelte'
  import InputGroup from '$lib/atoms/InputGroup.svelte'
  import Label from '$lib/atoms/Label.svelte'
  import { makeImageUrl } from '$lib/cover-art'
  import DeleteIcon from '$lib/icons/DeleteIcon.svelte'
  import { createEditPlaylistMutation, createPlaylistQuery } from '$lib/services/playlists'
  import { getContextToast } from '$lib/toast/toast'
  import { getContextClient } from '$lib/trpc'

  import CoverArt from './CoverArt.svelte'

  export let playlistId: number

  const trpc = getContextClient()
  const toast = getContextToast()

  const playlistQuery = createPlaylistQuery(trpc, playlistId)

  let data:
    | {
        name: string
        description: string | undefined
        art: Blob | undefined
      }
    | undefined = undefined
  $: {
    if ($playlistQuery.data && !data) {
      const playlist = $playlistQuery.data
      data = {
        name: playlist.name,
        description: playlist.description ?? undefined,
        art: undefined,
      }

      if (playlist.imageId !== null) {
        void fetch(makeImageUrl(playlist.imageId))
          .then((res) => res.blob())
          .then((blob) => {
            if (data) {
              data.art = blob
            }
          })
      }
    }
  }

  const editPlaylistMutation = createEditPlaylistMutation(trpc)
  const handleEditPlaylist = async () => {
    if ($editPlaylistMutation.isLoading) return
    if (!data) {
      toast.error('Playlist data is not loaded yet')
      return
    }

    $editPlaylistMutation.mutate(
      {
        id: playlistId,
        data: { name: data.name || 'Untitled Playlist', description: data.description || null },
        art: await ifDefined(data.art, blobToBase64),
      },
      {
        onSuccess: (data) => {
          toast.success(`Updated ${data.name}!`)
          close()
        },
      }
    )
  }

  const dispatch = createEventDispatcher<{ close: undefined; add: undefined }>()
  const close = () => dispatch('close')
</script>

<form on:submit|preventDefault={handleEditPlaylist}>
  <Dialog title="Edit details" on:close={close}>
    <div class="flex items-center gap-3">
      <div class="h-32 w-32">
        {#if data}
          {#if data.art}
            <button
              type="button"
              class="relative h-full w-full shadow"
              on:click={() => {
                if (data) {
                  data.art = undefined
                }
              }}
            >
              <CoverArt src={URL.createObjectURL(data.art)} alt="Album Art">
                <DeleteIcon />
              </CoverArt>
            </button>
          {:else}
            <FileDrop
              class="h-full w-full text-xs"
              on:drop={(e) => {
                if (data) {
                  data.art = e.detail.at(0)
                }
              }}
            />
          {/if}
        {/if}
      </div>
      <div class="space-y-2">
        <InputGroup>
          <Label for="playlist-edit-name">Name</Label>
          {#if data}
            <Input id="playlist-edit-name" bind:value={data.name} />
          {:else}
            <Input id="playlist-edit-name" class="skeleton" disabled />
          {/if}
        </InputGroup>
        <InputGroup>
          <Label for="playlist-edit-description">Description</Label>
          {#if data}
            <Input
              id="playlist-edit-description"
              bind:value={data.description}
              placeholder="Optional"
            />
          {:else}
            <Input id="playlist-edit-description" class="skeleton" disabled />
          {/if}
        </InputGroup>
      </div>
    </div>

    <svelte:fragment slot="buttons">
      <Button
        type="submit"
        on:click={close}
        loading={$editPlaylistMutation.isLoading}
        disabled={!data}>Save</Button
      >
      <Button kind="outline" on:click={close}>Cancel</Button>
    </svelte:fragment>
  </Dialog>
</form>
