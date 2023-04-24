<script lang="ts">
  import { ifDefined } from 'utils'

  import { createTagsQuery } from '$lib/services/tags'
  import type { TrackTagsFilter } from '$lib/tag-filter'
  import { getContextClient } from '$lib/trpc'

  import Delay from './Delay.svelte'

  export let filter: TrackTagsFilter | undefined

  const trpc = getContextClient()
  const tagsQuery = createTagsQuery(trpc)
  $: tagsMap_ = ifDefined($tagsQuery.data, (tags) => new Map(tags.map((tag) => [tag.id, tag])))
</script>

{#if filter !== undefined}
  {#if tagsMap_ !== undefined}
    {#if typeof filter === 'number'}
      {@const tag = tagsMap_.get(filter)}
      {#if tag !== undefined}
        <a href="/tags/{tag.id}" target="_blank" class="font-semibold text-white hover:underline"
          >{tag.name}</a
        >
      {:else}
        <span class="text-error-500 font-semibold">[unknown]</span>
      {/if}
    {:else}
      <span class="text-gray-400"
        >({#each filter.tags as tag, i}{#if i > 0}{' '}{#if filter.kind === 'and'}and{:else}or{/if}
          {/if}<svelte:self filter={tag} />{/each})</span
      >
    {/if}
  {:else if $tagsQuery.error}
    <span class="text-error-500">Error</span>
  {:else}
    <Delay>
      <span class="text-gray-400">Loading...</span>
    </Delay>
  {/if}
{/if}
