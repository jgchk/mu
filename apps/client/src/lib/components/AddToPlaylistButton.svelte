<script lang="ts">
  import type { ComponentProps } from 'svelte'

  import { clickOutside } from '$lib/actions/clickOutside'
  import { createPopperAction } from '$lib/actions/popper'
  import IconButton from '$lib/atoms/IconButton.svelte'
  import PlusIcon from '$lib/icons/PlusIcon.svelte'

  import AddToPlaylistPopover from './AddToPlaylistPopover.svelte'

  export let trackId: number
  export let layer: ComponentProps<IconButton>['layer'] = undefined
  export let offset: ComponentProps<AddToPlaylistPopover>['offset'] = undefined
  export let excludePlaylistId: ComponentProps<AddToPlaylistPopover>['excludePlaylistId'] =
    undefined

  let showAddToPlaylistPopover: { trackId: number } | false = false
  const [popperElement, popperTooltip] = createPopperAction()
</script>

<div use:popperElement use:clickOutside={() => (showAddToPlaylistPopover = false)}>
  <IconButton
    {layer}
    kind="text"
    tooltip="Add to playlist"
    on:click={() => {
      if (showAddToPlaylistPopover) {
        showAddToPlaylistPopover = false
      } else {
        showAddToPlaylistPopover = { trackId }
      }
    }}
  >
    <PlusIcon />
  </IconButton>

  {#if showAddToPlaylistPopover}
    <AddToPlaylistPopover
      trackId={showAddToPlaylistPopover.trackId}
      on:close={() => (showAddToPlaylistPopover = false)}
      {popperTooltip}
      {offset}
      {excludePlaylistId}
    />
  {/if}
</div>
