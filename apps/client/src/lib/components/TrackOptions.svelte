<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import type { ComponentProps } from 'svelte'

  import { createPopperAction } from '$lib/actions/popper'
  import IconButton from '$lib/atoms/IconButton.svelte'
  import DotsVerticalIcon from '$lib/icons/DotsVerticalIcon.svelte'
  import { useBreakpoint } from '$lib/utils/media-query'

  import type { TrackListTrack as TrackListTrackType } from './TrackList'
  import TrackPopover from './TrackPopover.svelte'
  import TrackPopoverMobile from './TrackPopoverMobile.svelte'

  export let track: TrackListTrackType
  export let showDelete = false
  export let layer: ComponentProps<IconButton>['layer']

  let showMore = false
  const isMedium = useBreakpoint('md')

  const [popperElement, popperTooltip] = createPopperAction()

  const dispatch = createEventDispatcher<{ delete: undefined }>()
</script>

<div use:popperElement>
  <IconButton {layer} kind="text" tooltip="More options" on:click={() => (showMore = !showMore)}>
    <DotsVerticalIcon />
  </IconButton>
</div>

{#if showMore}
  {#if $isMedium}
    <TrackPopover
      {popperTooltip}
      {track}
      {showDelete}
      on:close={() => (showMore = false)}
      on:delete={() => dispatch('delete')}
    />
  {:else}
    <TrackPopoverMobile
      {track}
      {showDelete}
      on:close={() => (showMore = false)}
      on:delete={() => dispatch('delete')}
    />
  {/if}
{/if}
