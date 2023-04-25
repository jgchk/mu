<script lang="ts">
  import type { ComponentProps } from 'svelte'

  import { clickOutside } from '$lib/actions/clickOutside'
  import { createPopperAction } from '$lib/actions/popper'
  import IconButton from '$lib/atoms/IconButton.svelte'
  import TagIcon from '$lib/icons/TagIcon.svelte'
  import { getContextClient } from '$lib/trpc'

  import TagsPopover from './TrackListTrackTagsPopover.svelte'

  export let trackId: number
  export let layer: ComponentProps<IconButton>['layer'] = undefined

  let showAddTagPopover = false
  const [popperElement, popperTooltip] = createPopperAction()

  const trpc = getContextClient()
  const close = () => {
    void trpc.tracks.getByTag.utils.invalidate()
    void trpc.playlists.tracks.utils.invalidate()
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
    <TagIcon />
  </IconButton>

  {#if showAddTagPopover}
    <TagsPopover {trackId} {popperTooltip} on:close={close} />
  {/if}
</div>
