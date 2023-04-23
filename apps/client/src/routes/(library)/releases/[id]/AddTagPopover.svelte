<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  import type { PopperTooltipAction } from '$lib/actions/popper'
  import TagsPopover from '$lib/components/TagsPopover.svelte'
  import { createReleaseTagMutation } from '$lib/services/tags'
  import { getContextClient } from '$lib/trpc'

  export let releaseId: number
  export let selectedTagIds: number[]

  export let popperTooltip: PopperTooltipAction

  const trpc = getContextClient()
  const tagMutation = createReleaseTagMutation(trpc)
  const handleTag = (tagId: number, tagged: boolean) => {
    $tagMutation.mutate({ releaseId, tagId, tagged })
  }

  const dispatch = createEventDispatcher<{ close: undefined }>()
  const close = () => dispatch('close')
</script>

<TagsPopover
  {selectedTagIds}
  {popperTooltip}
  offset={12}
  on:close={close}
  on:tag={(e) => handleTag(e.detail.id, e.detail.tagged)}
/>
