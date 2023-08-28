<script lang="ts">
  import type { ComponentProps } from 'svelte'

  import { clickOutside } from '$lib/actions/clickOutside'
  import { createPopperAction } from '$lib/actions/popper'
  import IconButton from '$lib/atoms/IconButton.svelte'
  import TagIcon from '$lib/icons/TagIcon.svelte'
  import TagOutlineIcon from '$lib/icons/TagOutlineIcon.svelte'
  import { prefetchTagsQuery } from '$lib/services/tags'
  import { getContextClient } from '$lib/trpc'

  import TagsPopover from './TrackTagsPopover.svelte'

  export let trackId: number
  export let selectedTagIds: number[]
  export let layer: ComponentProps<IconButton>['layer'] = undefined

  let showAddTagPopover = false
  const [popperElement, popperTooltip] = createPopperAction()

  const trpc = getContextClient()
  $: hasTags = selectedTagIds.length > 0

  void prefetchTagsQuery(trpc, { taggable: true })

  const close = () => {
    void trpc.tracks.getByTag.utils.invalidate()
    void trpc.tracks.getByPlaylistId.utils.invalidate()
    showAddTagPopover = false
  }
</script>

<div use:popperElement use:clickOutside={close}>
  <IconButton
    {layer}
    kind="text"
    tooltip="Edit tags"
    on:click={() => {
      if (showAddTagPopover) {
        close()
      } else {
        showAddTagPopover = true
      }
    }}
  >
    {#if hasTags}
      <TagIcon />
    {:else}
      <TagOutlineIcon />
    {/if}
  </IconButton>

  {#if showAddTagPopover}
    <TagsPopover {trackId} {selectedTagIds} {popperTooltip} on:close={close} />
  {/if}
</div>
