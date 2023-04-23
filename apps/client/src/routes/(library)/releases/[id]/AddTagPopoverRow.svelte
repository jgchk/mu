<script lang="ts">
  import Button from '$lib/atoms/Button.svelte'
  import CheckIcon from '$lib/icons/CheckIcon.svelte'
  import { createAddReleaseTagMutation, createDeleteReleaseTagMutation } from '$lib/services/tags'
  import { getContextClient } from '$lib/trpc'

  export let tag: { id: number; name: string }
  export let selected: boolean
  export let releaseId: number

  const trpc = getContextClient()

  const addTagMutation = createAddReleaseTagMutation(trpc)
  const handleAddTag = () => {
    $addTagMutation.mutate({ releaseId, tagId: tag.id })
  }

  const deleteTagMutation = createDeleteReleaseTagMutation(trpc)
  const handleDeleteTag = () => {
    $deleteTagMutation.mutate({ releaseId, tagId: tag.id })
  }
</script>

<Button
  kind="text"
  class="w-full text-white"
  layer={700}
  align="left"
  on:click={() => (selected ? handleDeleteTag() : handleAddTag())}
  icon={selected ? CheckIcon : undefined}
>
  {tag.name}
</Button>
