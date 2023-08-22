<script lang="ts">
  import { decode } from 'bool-lang'
  import { createEventDispatcher } from 'svelte'
  import { ifNotNullOrUndefined, tryOr } from 'utils'
  import { blobToBase64 } from 'utils/browser'

  import Button from '$lib/atoms/Button.svelte'
  import Dialog from '$lib/atoms/Dialog.svelte'
  import { createNewPlaylistMutation } from '$lib/services/playlists'
  import { getContextToast } from '$lib/toast/toast'
  import { getContextClient } from '$lib/trpc'

  import AutoPlaylistDetailsForm from './AutoPlaylistDetailsForm.svelte'
  import LinkToast from './LinkToast.svelte'

  const dispatch = createEventDispatcher<{ close: undefined }>()
  const close = () => dispatch('close')

  export let name = ''
  export let filter = ''

  let data: {
    name: string
    description: string | undefined
    art: Blob | null | undefined
    filter: string
  } = {
    name,
    description: undefined,
    art: null,
    filter,
  }

  $: parsedFilter = tryOr(() => decode(data.filter), undefined)

  const trpc = getContextClient()
  const newPlaylistMutation = createNewPlaylistMutation(trpc)

  const toast = getContextToast()

  const handleSubmit = async () => {
    if ($newPlaylistMutation.isLoading) return

    if (!parsedFilter) {
      if (data.filter.length > 0) {
        toast.error('Filter is invalid :(')
      } else {
        toast.error('Filter is required')
      }
      return
    }

    $newPlaylistMutation.mutate(
      {
        name: data.name || 'Untitled Playlist',
        description: data.description || null,
        art: await ifNotNullOrUndefined(data.art, blobToBase64),
        filter: data.filter,
      },
      {
        onSuccess: (data) => {
          toast.success(LinkToast, {
            props: {
              message: [
                'Created ',
                { href: `/library/playlists/${data.id}`, text: data.name },
                '!',
              ],
            },
          })
          close()
        },
      }
    )
  }
</script>

<form on:submit|preventDefault={handleSubmit}>
  <Dialog title="New auto playlist" on:close={close}>
    <AutoPlaylistDetailsForm bind:data />

    <svelte:fragment slot="buttons">
      <Button
        type="submit"
        loading={$newPlaylistMutation.isLoading}
        disabled={!parsedFilter}
        tooltip={!parsedFilter
          ? data.filter.length > 0
            ? 'Disabled: Invalid filter'
            : 'Disabled: Filter is required'
          : undefined}
      >
        Save
      </Button>
      <Button kind="outline" on:click={close}>Cancel</Button>
    </svelte:fragment>
  </Dialog>
</form>
