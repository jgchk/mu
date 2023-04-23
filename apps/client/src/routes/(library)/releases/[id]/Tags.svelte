<script lang="ts">
  import { clickOutside } from '$lib/actions/clickOutside'
  import { createPopperAction } from '$lib/actions/popper'
  import { tooltip } from '$lib/actions/tooltip'
  import PencilIcon from '$lib/icons/PencilIcon.svelte'
  import { createReleaseTagsQuery } from '$lib/services/tags'
  import { getContextClient } from '$lib/trpc'

  import AddTagPopover from './AddTagPopover.svelte'

  export let releaseId: number

  const trpc = getContextClient()
  $: releaseTagsQuery = createReleaseTagsQuery(trpc, releaseId)

  let showAddTagPopover = false
  const [popperElement, popperTooltip] = createPopperAction()
</script>

{#if $releaseTagsQuery.data}
  {@const tags = $releaseTagsQuery.data}

  <div class="flex items-center">
    {#if tags.length}
      <ul class="comma-list text-sm text-gray-400">
        {#each tags as tag (tag.id)}
          <li>
            <a href="/tags/{tag.id}" class="transition hover:text-white hover:underline"
              >{tag.name}</a
            >
          </li>
        {/each}
      </ul>
    {:else}
      <div class="text-sm text-gray-400">No tags</div>
    {/if}

    <div
      class="ml-3 w-fit opacity-0 transition group-hover/tags:opacity-100"
      use:popperElement
      use:clickOutside={() => (showAddTagPopover = false)}
    >
      <button
        type="button"
        class="group/tag-button relative block text-xs text-gray-400 hover:text-white"
        on:click={() => (showAddTagPopover = !showAddTagPopover)}
        use:tooltip={{ content: 'Edit tags', offset: [0, 12] }}
      >
        <div
          class="absolute -left-[5px] -top-[4px] h-[25px] w-[25px] rounded-full bg-gray-700 opacity-0 transition group-hover/tag-button:opacity-100"
        />
        <PencilIcon class="relative" size={15} />
      </button>

      {#if showAddTagPopover}
        <AddTagPopover
          {releaseId}
          {popperTooltip}
          selectedTagIds={tags.map((t) => t.id)}
          on:close={() => (showAddTagPopover = false)}
        />
      {/if}
    </div>
  </div>
{/if}
