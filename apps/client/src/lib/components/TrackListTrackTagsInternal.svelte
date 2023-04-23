<script lang="ts">
  import { flip } from 'svelte/animate'

  import { dnd } from '$lib/actions/dnd'
  import { createReorderTrackTagsMutation } from '$lib/services/tags'
  import type { RouterOutput } from '$lib/trpc'
  import { getContextClient } from '$lib/trpc'

  export let trackId: number
  export let tags: RouterOutput['tags']['getByTrack']

  const trpc = getContextClient()
  const reorderTagsMutation = createReorderTrackTagsMutation(trpc)
</script>

<ul
  class="comma-list text-sm text-gray-400"
  use:dnd={{ items: tags, dragDisabled: $reorderTagsMutation.isLoading }}
  on:consider={(e) => (tags = e.detail.items)}
  on:finalize={(e) => {
    const previousTags = [...tags]
    tags = e.detail.items
    $reorderTagsMutation.mutate(
      {
        trackId,
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
    <li animate:flip={{ duration: dnd.defaults.flipDurationMs }}>
      <a href="/tags/{tag.id}" class="transition hover:text-white hover:underline">{tag.name}</a>
    </li>
  {/each}
</ul>
