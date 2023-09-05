<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import type { ComponentProps } from 'svelte'

  import IconButton from '$lib/atoms/IconButton.svelte'
  import DotsVerticalIcon from '$lib/icons/DotsVerticalIcon.svelte'
  import { useBreakpoint } from '$lib/utils/media-query'

  import type { TrackListTrack as TrackListTrackType } from './TrackList'
  import TrackOptionsInline from './TrackOptionsInline.svelte'
  import TrackOptionsMobile from './TrackOptionsMobile.svelte'

  export let track: TrackListTrackType
  export let showDelete = false
  export let layer: ComponentProps<IconButton>['layer']

  let showMore = false
  const isMedium = useBreakpoint('md')

  const dispatch = createEventDispatcher<{ delete: undefined }>()
</script>

{#if $isMedium}
  <TrackOptionsInline {track} {showDelete} on:delete={() => dispatch('delete')} />
{:else}
  <IconButton {layer} kind="text" tooltip="More options" on:click={() => (showMore = !showMore)}>
    <DotsVerticalIcon />
  </IconButton>
{/if}

{#if showMore}
  <TrackOptionsMobile
    {track}
    {showDelete}
    on:close={() => (showMore = false)}
    on:delete={() => dispatch('delete')}
  />
{/if}
