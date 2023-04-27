<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import { createEventDispatcher } from 'svelte'

  import Button from '$lib/atoms/Button.svelte'
  import Dialog from '$lib/atoms/Dialog.svelte'
  import { createDeleteTagMutation } from '$lib/services/tags'
  import { getContextToast } from '$lib/toast/toast'
  import { getContextClient } from '$lib/trpc'

  export let tag: {
    id: number
    name: string
  }

  const trpc = getContextClient()
  const toast = getContextToast()

  const deleteMutation = createDeleteTagMutation(trpc)
  const handleDelete = () => {
    if ($deleteMutation.isLoading) return

    $deleteMutation.mutate(
      { id: tag.id },
      {
        onSuccess: () => {
          toast.success(`Deleted ${tag.name}`)
          if ($page.url.pathname === `/tags/${tag.id}`) {
            void goto('/tags')
          }
          close()
        },
      }
    )
  }

  const dispatch = createEventDispatcher<{ close: undefined; add: undefined }>()
  const close = () => dispatch('close')
</script>

<Dialog title="Delete playlist" class="max-w-lg" on:close={close}>
  Are you sure you want to delete <span class="font-semibold">{tag.name}</span>?

  <svelte:fragment slot="buttons">
    <Button type="submit" on:click={handleDelete} loading={$deleteMutation.isLoading}>
      Delete
    </Button>
    <Button kind="outline" on:click={close}>Cancel</Button>
  </svelte:fragment>
</Dialog>
