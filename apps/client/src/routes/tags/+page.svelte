<script lang="ts">
  import Button from '$lib/atoms/Button.svelte'
  import { getContextDialogs } from '$lib/dialogs/dialogs'
  import { createTagsQuery } from '$lib/services/tags'
  import { getContextClient } from '$lib/trpc'

  const trpc = getContextClient()
  const tagsQuery = createTagsQuery(trpc)

  const dialogs = getContextDialogs()
</script>

<div class="h-full">
  <Button on:click={() => dialogs.open('new-tag')}>New Tag</Button>

  {#if $tagsQuery.data}
    {@const tags = $tagsQuery.data}
    {#each tags as tag (tag.id)}
      <a href="/tags/{tag.id}">{tag.name}</a>
    {/each}
  {:else if $tagsQuery.error}
    <div>{$tagsQuery.error.message}</div>
  {:else}
    <div>Loading...</div>
  {/if}
</div>
