<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import { createEventDispatcher } from 'svelte'

  import Button from '$lib/atoms/Button.svelte'
  import Dialog from '$lib/atoms/Dialog.svelte'
  import { getContextToast } from '$lib/toast/toast'
  import { getContextClient } from '$lib/trpc'

  export let release: {
    id: number
    title: string | null
  }

  const trpc = getContextClient()
  const toast = getContextToast()

  const deleteReleaseMutation = trpc.releases.delete.mutation()
  const handleDeleteRelease = () => {
    if ($deleteReleaseMutation.isLoading) return

    $deleteReleaseMutation.mutate(
      { id: release.id },
      {
        onSuccess: () => {
          toast.success(`Deleted ${release.title || 'release'}`)
          if ($page.url.pathname === `/library/releases/${release.id}`) {
            void goto('/library/releases')
          }
          close()
        },
      }
    )
  }

  const dispatch = createEventDispatcher<{ close: undefined; add: undefined }>()
  const close = () => dispatch('close')
</script>

<Dialog title="Delete release" class="max-w-lg" on:close={close}>
  Are you sure you want to delete {#if release.title}<span class="font-semibold"
      >{release.title}</span
    >{:else}this release{/if}?

  <svelte:fragment slot="buttons">
    <Button type="submit" on:click={handleDeleteRelease} loading={$deleteReleaseMutation.isLoading}>
      Delete
    </Button>
    <Button kind="outline" on:click={close}>Cancel</Button>
  </svelte:fragment>
</Dialog>
