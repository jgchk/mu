<script lang="ts">
  import CoverArt from '$lib/components/CoverArt.svelte'
  import FlowGrid from '$lib/components/FlowGrid.svelte'
  import { makeImageUrl } from '$lib/cover-art'
  import { createReleasesByTagQuery } from '$lib/services/releases'
  import { createTagQuery, createTagsTreeQuery } from '$lib/services/tags'
  import { getContextClient } from '$lib/trpc'

  import Layout from '../+layout.svelte'
  import NavNode from '../NavNode.svelte'
  import type { PageData } from './$types'

  export let data: PageData

  const trpc = getContextClient()
  const tagQuery = createTagQuery(trpc, data.id)
  const tagsQuery = createTagsTreeQuery(trpc)

  const releasesQuery = createReleasesByTagQuery(trpc, data.id)
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

  <h2 class="mb-4 mt-8 text-2xl font-bold">Releases</h2>
  {#if $releasesQuery.data}
    {@const releases = $releasesQuery.data}
    <FlowGrid>
      {#each releases as release (release.id)}
        <div class="w-full">
          <a href="/releases/{release.id}" class="w-full">
            <CoverArt
              src={release.imageId !== null
                ? makeImageUrl(release.imageId, { size: 512 })
                : undefined}
            />
          </a>
          <a
            href="/releases/{release.id}"
            class="mt-1 block truncate font-medium hover:underline"
            title={release.title}
          >
            {release.title}
          </a>
        </div>
      {/each}
    </FlowGrid>
  {:else if $releasesQuery.error}
    <div>{$releasesQuery.error.message}</div>
  {:else}
    <div>Loading...</div>
  {/if}
</Layout>
