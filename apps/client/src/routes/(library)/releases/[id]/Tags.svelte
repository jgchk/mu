<script lang="ts">
  import { createReleaseTagsQuery } from '$lib/services/tags'
  import { getContextClient } from '$lib/trpc'

  import TagsButton from './TagsButton.svelte'

  export let releaseId: number

  const trpc = getContextClient()
  $: releaseTagsQuery = createReleaseTagsQuery(trpc, releaseId)
</script>

{#if $releaseTagsQuery.data}
  {@const tags = $releaseTagsQuery.data}

  <div class="flex items-center">
    {#if tags.length}
      <ul class="comma-list text-sm text-gray-400">
        {#each tags as tag (tag.id)}
          <li>
            <a href="/tags/{tag.id}" class="transition hover:text-white hover:underline"
              >{tag.name}</a
            >
          </li>
        {/each}
      </ul>
    {:else}
      <div class="text-sm text-gray-400">No tags</div>
    {/if}

    <div class="ml-2 h-0">
      <TagsButton
        {releaseId}
        class="relative -top-[15px] opacity-0 transition group-hover/tags:opacity-100"
      />
    </div>
  </div>
{/if}
