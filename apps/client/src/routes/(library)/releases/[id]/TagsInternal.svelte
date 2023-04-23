<script lang="ts">
  import { flip } from 'svelte/animate'

  import { dnd } from '$lib/actions/dnd'
  import { createReorderReleaseTagsMutation } from '$lib/services/tags'
  import type { RouterOutput } from '$lib/trpc'
  import { getContextClient } from '$lib/trpc'

  export let releaseId: number
  export let tags: RouterOutput['tags']['getByRelease']

  const trpc = getContextClient()
  const reorderTagsMutation = createReorderReleaseTagsMutation(trpc)
</script>

<ul
  class="comma-list text-sm"
  use:dnd={{ items: tags, dragDisabled: $reorderTagsMutation.isLoading }}
  on:consider={(e) => (tags = e.detail.items)}
  on:finalize={(e) => {
    const previousTags = [...tags]
    tags = e.detail.items
    $reorderTagsMutation.mutate(
      {
        releaseId,
        tags: e.detail.items.map((t) => t.id),
      },
      {
        onError: () => {
          if (previousTags) {
            tags = previousTags
          }
        },
      }
    )
  }}
>
  {#each tags as tag (tag.id)}
    <li animate:flip={{ duration: dnd.defaults.flipDurationMs }}>{tag.name}</li>
  {/each}
</ul>
