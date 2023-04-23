<script lang="ts">
  import type { RouterOutput } from '$lib/trpc'

  export let id: number
  export let tagsMap: Map<number, RouterOutput['tags']['getAllTree'][0]>
  export let current = false

  $: tag = tagsMap.get(id)
</script>

{#if tag}
  {#if current}
    <div class="font-bold text-white">{tag.name}</div>
  {:else}
    <a href="/tags/{tag.id}" class="text-gray-400 hover:underline">{tag.name}</a>
  {/if}

  <ul class="border-l border-gray-800">
    {#each tag.children as child (child)}
      <li class="ml-2">
        <svelte:self id={child} {tagsMap} />
      </li>
    {/each}
  </ul>
{/if}
