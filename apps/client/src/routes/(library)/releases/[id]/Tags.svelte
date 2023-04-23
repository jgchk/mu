<script lang="ts">
  import { clickOutside } from '$lib/actions/clickOutside'
  import { createPopperAction } from '$lib/actions/popper'
  import { tooltip } from '$lib/actions/tooltip'
  import { createReleaseTagsQuery } from '$lib/services/tags'
  import { getContextClient } from '$lib/trpc'

  import AddTagPopover from './AddTagPopover.svelte'
  import TagsInternal from './TagsInternal.svelte'

  export let releaseId: number

  const trpc = getContextClient()
  $: releaseTagsQuery = createReleaseTagsQuery(trpc, releaseId)

  let showAddTagPopover = false
  const [popperElement, popperTooltip] = createPopperAction()
</script>

{#if $releaseTagsQuery.data}
  {@const tags = $releaseTagsQuery.data}

  <div class="flex items-center gap-2">
    <TagsInternal {tags} {releaseId} />

    <div class="w-fit" use:popperElement use:clickOutside={() => (showAddTagPopover = false)}>
      <button
        type="button"
        class="text-gray-400 hover:text-white hover:underline"
        on:click={() => (showAddTagPopover = !showAddTagPopover)}
        use:tooltip={{ content: 'Add tag' }}>+</button
      >

      {#if showAddTagPopover}
        <AddTagPopover
          {releaseId}
          {popperTooltip}
          excludeTagIds={tags.map((t) => t.id)}
          on:close={() => (showAddTagPopover = false)}
        />
      {/if}
    </div>
  </div>
{/if}
