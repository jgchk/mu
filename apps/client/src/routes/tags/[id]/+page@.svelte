<script lang="ts">
  import { createTagQuery, createTagsTreeQuery } from '$lib/services/tags'
  import { getContextClient } from '$lib/trpc'

  import Layout from '../+layout.svelte'
  import NavNode from '../NavNode.svelte'
  import type { PageData } from './$types'

  export let data: PageData

  const trpc = getContextClient()
  const tagQuery = createTagQuery(trpc, data.id)
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

  {#if $tagQuery.data}
    {@const tag = $tagQuery.data}
    <div class="relative flex items-end gap-6">
      <div class="space-y-1 pb-2">
        <h1 class="mr-11 line-clamp-2 break-all text-6xl font-bold leading-[1.19]" title={tag.name}>
          {tag.name}
        </h1>
        {#if tag.description}
          <p
            class="line-clamp-5 whitespace-pre-wrap leading-[1.19] text-gray-400"
            title={tag.description}
          >
            {tag.description}
          </p>
        {/if}
      </div>
    </div>
  {/if}
</Layout>
