<script lang="ts">
  import type { ComponentProps } from 'svelte'
  import { ifDefined } from 'utils'

  import { clickOutside } from '$lib/actions/clickOutside'
  import { createPopperAction } from '$lib/actions/popper'
  import IconButton from '$lib/atoms/IconButton.svelte'
  import TagIcon from '$lib/icons/TagIcon.svelte'
  import { createReleaseTagsQuery } from '$lib/services/tags'
  import { getContextClient } from '$lib/trpc'
  import { cn } from '$lib/utils/classes'

  import AddTagPopover from './AddTagPopover.svelte'

  export let releaseId: number
  export let layer: ComponentProps<IconButton>['layer'] = undefined

  let showPopover = false
  const [popperElement, popperTooltip] = createPopperAction()

  const trpc = getContextClient()
  $: releaseTagsQuery = createReleaseTagsQuery(trpc, releaseId)
  $: selectedTagIds = ifDefined($releaseTagsQuery.data, (tags) => tags.map((t) => t.id)) ?? []
</script>

<div use:popperElement use:clickOutside={() => (showPopover = false)} class="relative -top-[15px]">
  <IconButton
    {layer}
    class={cn('transition', showPopover ? 'opacity-100' : 'opacity-0 group-hover/tags:opacity-100')}
    kind="text"
    tooltip="Edit tags"
    on:click={() => (showPopover = !showPopover)}
  >
    <TagIcon />
  </IconButton>

  {#if showPopover}
    <AddTagPopover
      {releaseId}
      {popperTooltip}
      {selectedTagIds}
      on:close={() => (showPopover = false)}
    />
  {/if}
</div>
