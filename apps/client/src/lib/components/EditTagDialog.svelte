<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  import Button from '$lib/atoms/Button.svelte'
  import Dialog from '$lib/atoms/Dialog.svelte'
  import { createEditTagMutation } from '$lib/services/tags'
  import { getContextToast } from '$lib/toast/toast'
  import { getContextClient } from '$lib/trpc'

  import LinkToast from './LinkToast.svelte'
  import TagDetailsForm from './TagDetailsForm.svelte'

  export let tag: {
    id: number
    name: string
    description: string | null
    taggable: boolean
    parents: number[]
    children: number[]
  }

  let data: {
    name: string
    description: string
    taggable: boolean
    parents: number[]
    children: number[]
  } = {
    name: tag.name,
    description: tag.description ?? '',
    taggable: tag.taggable,
    parents: tag.parents,
    children: tag.children,
  }

  const trpc = getContextClient()
  const editTagMutation = createEditTagMutation(trpc)

  const toast = getContextToast()

  const handleSubmit = () => {
    $editTagMutation.mutate(
      {
        id: tag.id,
        data: {
          name: data.name,
          description: data.description || null,
          taggable: data.taggable,
          parents: data.parents,
          children: data.children,
        },
      },
      {
        onSuccess: (data) => {
          toast.success(LinkToast, {
            props: {
              message: ['Updated ', { href: `/tags/${data.id}`, text: data.name }, '!'],
            },
          })
          close()
        },
      }
    )
  }

  const dispatch = createEventDispatcher<{ close: undefined }>()
  const close = () => dispatch('close')
</script>

<form on:submit|preventDefault={handleSubmit}>
  <Dialog title="Edit tag" on:close={close}>
    <TagDetailsForm {data} />

    <svelte:fragment slot="buttons">
      <Button type="submit" loading={$editTagMutation.isLoading}>Save</Button>
      <Button kind="outline" on:click={close}>Cancel</Button>
    </svelte:fragment>
  </Dialog>
</form>
