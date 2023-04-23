<script lang="ts">
  import { clickOutside } from '$lib/actions/clickOutside'
  import { createPopperAction } from '$lib/actions/popper'
  import { tooltip } from '$lib/actions/tooltip'
  import { createTrackTagsQuery } from '$lib/services/tags'
  import { getContextClient } from '$lib/trpc'

  import AddTagPopover from './TrackListTrackAddTagPopover.svelte'
  import TagsInternal from './TrackListTrackTagsInternal.svelte'

  export let trackId: number

  const trpc = getContextClient()
  $: trackTagsQuery = createTrackTagsQuery(trpc, trackId)

  let showAddTagPopover = false
  const [popperElement, popperTooltip] = createPopperAction()
</script>

{#if $trackTagsQuery.data}
  {@const tags = $trackTagsQuery.data}

  <div class="flex items-center gap-2">
    <TagsInternal {tags} {trackId} />

    <div class="w-fit" use:popperElement use:clickOutside={() => (showAddTagPopover = false)}>
      <button
        type="button"
        class="text-xs text-gray-400 hover:text-white hover:underline"
        on:click={() => (showAddTagPopover = !showAddTagPopover)}
        use:tooltip={{ content: 'Edit tags' }}>🖉</button
      >

      {#if showAddTagPopover}
        <AddTagPopover
          {trackId}
          {popperTooltip}
          selectedTagIds={tags.map((t) => t.id)}
          on:close={() => (showAddTagPopover = false)}
        />
      {/if}
    </div>
  </div>
{/if}
