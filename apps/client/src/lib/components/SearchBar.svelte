<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  import SearchIcon from '$lib/icons/SearchIcon.svelte'
  import XIcon from '$lib/icons/XIcon.svelte'
  import { cn } from '$lib/utils/classes'

  export let initialQuery: string | undefined = undefined
  $: query = initialQuery ?? ''

  let input: HTMLInputElement | undefined

  let class_: string | undefined = undefined
  export { class_ as class }

  export let layer: 'black' | 800 = 'black'
  export let autofocus = false

  const dispatch = createEventDispatcher<{ search: string; input: string }>()
</script>

<form class={class_} on:submit|preventDefault={() => dispatch('search', query)}>
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div
    class={cn(
      'group inline-flex w-full cursor-text items-center gap-2 rounded-full py-1 pl-3 pr-1.5 transition-all focus-within:bg-white',
      layer === 'black' && 'bg-gray-800',
      layer === 800 && 'bg-gray-700'
    )}
    on:click={() => input?.focus()}
  >
    <SearchIcon class="h-4 w-4 text-gray-400 group-focus-within:text-gray-600" />
    <!-- svelte-ignore a11y-autofocus -->
    <input
      class="min-w-0 flex-1 bg-transparent text-white outline-none group-focus-within:text-black"
      bind:this={input}
      type="text"
      bind:value={query}
      on:input={(e) => dispatch('input', e.currentTarget.value)}
      {autofocus}
    />
    <button
      type="button"
      class="center h-6 w-6 rounded-full text-gray-400 transition hover:bg-gray-600 group-focus-within:text-gray-600 hover:group-focus-within:bg-gray-200"
      on:click={() => {
        query = ''
        dispatch('search', '')
      }}
    >
      <XIcon class="h-4 w-4" />
    </button>
  </div>
  <button type="submit" class="hidden">Search</button>
</form>
