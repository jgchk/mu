<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  import Button from '$lib/atoms/Button.svelte'
  import Checkbox from '$lib/atoms/Checkbox.svelte'
  import Dialog from '$lib/atoms/Dialog.svelte'
  import Input from '$lib/atoms/Input.svelte'
  import InputGroup from '$lib/atoms/InputGroup.svelte'
  import Label from '$lib/atoms/Label.svelte'
  import TextArea from '$lib/atoms/TextArea.svelte'
  import { createTagMutation } from '$lib/services/tags'
  import { getContextToast } from '$lib/toast/toast'
  import { getContextClient } from '$lib/trpc'

  import LinkToast from './LinkToast.svelte'
  import TagMultiselect from './TagMultiselect.svelte'

  const dispatch = createEventDispatcher<{ close: undefined }>()
  const close = () => dispatch('close')

  let name = ''
  let description = ''
  let taggable = true
  let parents: number[] = []
  let children: number[] = []

  const trpc = getContextClient()
  const newPlaylistMutation = createTagMutation(trpc)

  const toast = getContextToast()

  const handleSubmit = () => {
    $newPlaylistMutation.mutate(
      {
        name: name,
        description: description || null,
        parents,
        children,
        taggable,
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
</script>

<form on:submit|preventDefault={handleSubmit}>
  <Dialog title="New tag" on:close={close}>
    <div class="flex items-center gap-3">
      <div class="flex-1 space-y-2">
        <InputGroup>
          <Label for="tag-edit-name">Name</Label>
          <Input id="tag-edit-name" class="w-full" bind:value={name} autofocus required />
        </InputGroup>
        <InputGroup>
          <Label for="tag-edit-description">Description</Label>
          <TextArea
            id="tag-edit-description"
            class="w-full"
            bind:value={description}
            rows={3}
            placeholder="Optional"
          />
        </InputGroup>
        <InputGroup>
          <Label for="tag-edit-parents">Parents</Label>
          <TagMultiselect
            id="tag-edit-parents"
            bind:value={parents}
            class="w-full"
            placeholder="Optional"
          />
        </InputGroup>
        <InputGroup>
          <Label for="tag-edit-children">Children</Label>
          <TagMultiselect
            id="tag-edit-children"
            bind:value={children}
            class="w-full"
            placeholder="Optional"
          />
        </InputGroup>
        <InputGroup layout="horizontal">
          <Checkbox id="tag-edit-taggable" bind:checked={taggable} />
          <Label for="tag-edit-taggable">Taggable</Label>
        </InputGroup>
      </div>
    </div>

    <svelte:fragment slot="buttons">
      <Button type="submit" loading={$newPlaylistMutation.isLoading}>Save</Button>
      <Button kind="outline" on:click={close}>Cancel</Button>
    </svelte:fragment>
  </Dialog>
</form>
