<script lang="ts">
  import type { BoolLang } from 'bool-lang'
  import { ifDefined } from 'utils'

  import { createTagsQuery } from '$lib/services/tags'
  import { getContextClient } from '$lib/trpc'
  import { tw } from '$lib/utils/classes'

  import Delay from './Delay.svelte'

  export let filter: BoolLang | undefined
  export let child = false

  export let tagClass: string | undefined = undefined

  const trpc = getContextClient()
  const tagsQuery = createTagsQuery(trpc)
  $: tagsMap_ = ifDefined($tagsQuery.data, (tags) => new Map(tags.map((tag) => [tag.id, tag])))
</script>

{#if filter !== undefined}
  {#if tagsMap_ !== undefined}
    {#if filter.kind === 'id'}
      {@const tag = tagsMap_.get(filter.value)}
      {#if tag !== undefined}
        <a
          href="/tags/{tag.id}"
          target="_blank"
          class={tw('font-semibold text-white hover:underline', tagClass)}>{tag.name}</a
        >
      {:else}
        <span class="text-error-500 font-semibold">[unknown]</span>
      {/if}
    {:else if filter.kind === 'not'}
      <span class="text-gray-400">not</span>
      <svelte:self filter={filter.child} child {tagClass} />
    {:else if filter.children.length === 1}
      <svelte:self filter={filter.children[0]} />
    {:else if filter.children.length > 1}
      <span class="text-gray-400"
        >{#if child}({/if}{#each filter.children as tag, i}{#if i > 0}{' '}{#if filter.kind === 'and'}and{:else}or{/if}
          {/if}<svelte:self filter={tag} child {tagClass} />{/each}{#if child}){/if}</span
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
