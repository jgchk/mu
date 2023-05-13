<script lang="ts">
  import FullscreenLoader from '$lib/components/FullscreenLoader.svelte'
  import { createTagsTreeQuery } from '$lib/services/tags'
  import { getContextClient } from '$lib/trpc'

  import Layout from './+layout.svelte'
  import NavNode from './NavNode.svelte'

  const trpc = getContextClient()
  const tagsQuery = createTagsTreeQuery(trpc)
</script>

<Layout>
  <svelte:fragment slot="sidebar">
    {#if $tagsQuery.data}
      {@const tags = $tagsQuery.data}
      {@const tagsMap = new Map(tags.map((t) => [t.id, t]))}
      {@const topLevelTags = tags.filter((t) => t.parents.length === 0)}

      {#each topLevelTags as tag (tag.id)}
        <NavNode id={tag.id} {tagsMap} />
      {/each}
    {:else if $tagsQuery.error}
      <div>{$tagsQuery.error.message}</div>
    {:else}
      <FullscreenLoader />
    {/if}
  </svelte:fragment>
</Layout>
