<script lang="ts">
  import { createTagsTreeQuery } from '$lib/services/tags'
  import { getContextClient } from '$lib/trpc'

  import Layout from '../+layout.svelte'
  import NavNode from '../NavNode.svelte'
  import type { PageData } from './$types'

  export let data: PageData

  const trpc = getContextClient()
  const tagsQuery = createTagsTreeQuery(trpc)
</script>

<Layout>
  <svelte:fragment slot="sidebar">
    {#if $tagsQuery.data}
      {@const tags = $tagsQuery.data}
      {@const tagsMap = new Map(tags.map((t) => [t.id, t]))}
      {@const tag = tagsMap.get(data.id)}

      {#if tag}
        {#each tag.parents as parentId (parentId)}
          {@const parent = tagsMap.get(parentId)}
          {#if parent}
            <a href="/tags/{parent.id}" class="block text-gray-400 hover:underline">
              {parent.name}
            </a>
          {/if}
        {/each}
      {/if}
      <NavNode id={data.id} {tagsMap} topLevel />
    {:else if $tagsQuery.error}
      <div>{$tagsQuery.error.message}</div>
    {:else}
      <div>Loading...</div>
    {/if}
  </svelte:fragment>
</Layout>
