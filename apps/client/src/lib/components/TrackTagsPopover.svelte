<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  import type { PopperTooltipAction } from '$lib/actions/popper'
  import { createTrackTagMutation } from '$lib/services/tags'
  import { getContextClient } from '$lib/trpc'

  import TagsPopover from './TagsPopover.svelte'

  export let trackId: number
  export let selectedTagIds: number[]

  export let popperTooltip: PopperTooltipAction

  const trpc = getContextClient()

  const tagMutation = createTrackTagMutation(trpc)
  const handleTag = (tagId: number, tagged: boolean) => {
    $tagMutation.mutate({ trackId, tagId, tagged })
  }

  const dispatch = createEventDispatcher<{ close: undefined }>()
  const close = () => dispatch('close')
</script>

<TagsPopover
  {selectedTagIds}
  {popperTooltip}
  on:close={close}
  on:tag={(e) => handleTag(e.detail.id, e.detail.tagged)}
/>
