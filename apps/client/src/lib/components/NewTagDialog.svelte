<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  import Button from '$lib/atoms/Button.svelte'
  import Dialog from '$lib/atoms/Dialog.svelte'
  import { createNewTagMutation } from '$lib/services/tags'
  import { getContextToast } from '$lib/toast/toast'
  import { getContextClient } from '$lib/trpc'

  import LinkToast from './LinkToast.svelte'
  import TagDetailsForm from './TagDetailsForm.svelte'

  let data: {
    name: string
    description: string
    taggable: boolean
    parents: number[]
    children: number[]
  } = {
    name: '',
    description: '',
    taggable: true,
    parents: [],
    children: [],
  }

  const trpc = getContextClient()
  const newTagMutation = createNewTagMutation(trpc)

  const toast = getContextToast()

  const handleSubmit = () => {
    $newTagMutation.mutate(
      {
        name: data.name,
        description: data.description || null,
        taggable: data.taggable,
        parents: data.parents,
        children: data.children,
      },
      {
        onSuccess: (data) => {
          toast.success(LinkToast, {
            props: {
              message: ['Created ', { href: `/tags/${data.id}`, text: data.name }, '!'],
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
  <Dialog title="New tag" on:close={close}>
    <TagDetailsForm {data} />

    <svelte:fragment slot="buttons">
      <Button type="submit" loading={$newTagMutation.isLoading}>Save</Button>
      <Button kind="outline" on:click={close}>Cancel</Button>
    </svelte:fragment>
  </Dialog>
</form>
