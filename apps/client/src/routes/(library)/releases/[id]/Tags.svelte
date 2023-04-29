<script lang="ts">
  import CommaList from '$lib/components/CommaList.svelte'
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
      <CommaList class="text-sm text-gray-400" items={tags} let:item>
        <a class="transition hover:text-white hover:underline" href="/artists/{item.id}"
          >{item.name}</a
        >
      </CommaList>
    {:else}
      <div class="text-sm text-gray-400">No tags</div>
    {/if}

    <div class="ml-2 h-0">
      <TagsButton {releaseId} />
    </div>
  </div>
{/if}
