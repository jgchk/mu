<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'

  import SearchIcon from '$lib/icons/SearchIcon.svelte'
  import XIcon from '$lib/icons/XIcon.svelte'

  export let query = ''
  let input: HTMLInputElement | undefined
</script>

<form
  class="hidden md:inline"
  on:submit|preventDefault={() => {
    if (query.length > 0) {
      if ($page.url.pathname.startsWith('/search')) {
        const newUrl = new URL($page.url)
        newUrl.searchParams.set('q', query)
        void goto(newUrl)
      } else {
        void goto(`/search?q=${query}`)
      }
    }
  }}
>
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <div
    class="group ml-2 inline-flex cursor-text items-center gap-2 rounded-full bg-gray-800 py-1 pl-3 pr-1 transition-all focus-within:bg-white"
    on:click={() => input?.focus()}
  >
    <SearchIcon class="h-4 w-4 text-gray-400 group-focus-within:text-gray-600" />
    <input
      class="bg-transparent text-white outline-none group-focus-within:text-black"
      bind:this={input}
      type="text"
      bind:value={query}
    />
    <button
      type="button"
      class="center pointer-events-none h-6 w-6 rounded-full text-gray-600 opacity-0 transition hover:bg-gray-200 group-focus-within:pointer-events-auto group-focus-within:opacity-100"
      on:click={() => (query = '')}
    >
      <XIcon class="h-4 w-4" />
    </button>
  </div>
  <button type="submit" class="hidden">Search</button>
</form>
