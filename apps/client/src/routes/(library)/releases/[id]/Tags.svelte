<script lang="ts">
  import IconButton from '$lib/atoms/IconButton.svelte'
  import TagSelect from '$lib/components/TagSelect.svelte'
  import PlusIcon from '$lib/icons/PlusIcon.svelte'
  import { createAddReleaseTagMutation, createReleaseTagsQuery } from '$lib/services/tags'
  import { getContextClient } from '$lib/trpc'

  import TagsInternal from './TagsInternal.svelte'

  export let releaseId: number

  const trpc = getContextClient()
  $: releaseTagsQuery = createReleaseTagsQuery(trpc, releaseId)

  let addTag: number | undefined
  const addTagMutation = createAddReleaseTagMutation(trpc)
  const handleAddTag = () => {
    if (addTag === undefined) return
    $addTagMutation.mutate({ releaseId, tagId: addTag })
  }
</script>

{#if $releaseTagsQuery.data}
  {@const tags = $releaseTagsQuery.data}

  <TagsInternal {tags} {releaseId} />
{/if}

<form class="flex items-center gap-1" on:submit|preventDefault={handleAddTag}>
  <TagSelect bind:value={addTag} />
  <IconButton type="submit" tooltip="Add tag" loading={$addTagMutation.isLoading}>
    <PlusIcon />
  </IconButton>
</form>
