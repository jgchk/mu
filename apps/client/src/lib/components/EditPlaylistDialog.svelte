<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { ifNotNullOrUndefined } from 'utils'
  import { blobToBase64 } from 'utils/browser'

  import Button from '$lib/atoms/Button.svelte'
  import Dialog from '$lib/atoms/Dialog.svelte'
  import FileDrop from '$lib/atoms/FileDrop.svelte'
  import Input from '$lib/atoms/Input.svelte'
  import InputGroup from '$lib/atoms/InputGroup.svelte'
  import Label from '$lib/atoms/Label.svelte'
  import TextArea from '$lib/atoms/TextArea.svelte'
  import { makeImageUrl } from '$lib/cover-art'
  import DeleteIcon from '$lib/icons/DeleteIcon.svelte'
  import { createEditPlaylistMutation } from '$lib/services/playlists'
  import { getContextToast } from '$lib/toast/toast'
  import { getContextClient } from '$lib/trpc'

  import CoverArt from './CoverArt.svelte'

  export let playlist: {
    id: number
    name: string
    description: string | null
    imageId: number | null
  }

  const trpc = getContextClient()
  const toast = getContextToast()

  let data: {
    name: string
    description: string | undefined
    art: Blob | null | undefined
  } = {
    name: playlist.name,
    description: playlist.description ?? undefined,
    art: playlist.imageId === null ? null : undefined,
  }

  const editPlaylistMutation = createEditPlaylistMutation(trpc)
  const handleEditPlaylist = async () => {
    if ($editPlaylistMutation.isLoading) return

    $editPlaylistMutation.mutate(
      {
        id: playlist.id,
        data: { name: data.name || 'Untitled Playlist', description: data.description || null },
        art: await ifNotNullOrUndefined(data.art, blobToBase64),
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
  <Dialog title="Edit details" class="max-w-lg" on:close={close}>
    <div class="flex items-center gap-3">
      <div class="h-44 w-44">
        {#if data.art === undefined && playlist.imageId}
          <button
            type="button"
            class="relative h-full w-full shadow"
            on:click={() => {
              if (data) {
                data.art = null
              }
            }}
          >
            <CoverArt src={makeImageUrl(playlist.imageId, { size: 512 })} alt="Album Art">
              <DeleteIcon />
            </CoverArt>
          </button>
        {:else if data.art}
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
                data.art = e.detail.at(0) ?? null
              }
            }}
          />
        {/if}
      </div>
      <div class="flex-1 space-y-2">
        <InputGroup>
          <Label for="playlist-edit-name">Name</Label>
          <Input id="playlist-edit-name" class="w-full" bind:value={data.name} autofocus />
        </InputGroup>
        <InputGroup>
          <Label for="playlist-edit-description">Description</Label>
          <TextArea
            id="playlist-edit-description"
            class="w-full"
            bind:value={data.description}
            rows={3}
            placeholder="Optional"
          />
        </InputGroup>
      </div>
    </div>

    <svelte:fragment slot="buttons">
      <Button type="submit" loading={$editPlaylistMutation.isLoading}>Save</Button>
      <Button kind="outline" on:click={close}>Cancel</Button>
    </svelte:fragment>
  </Dialog>
</form>
