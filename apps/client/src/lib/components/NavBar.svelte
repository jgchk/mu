<script lang="ts">
  import { goto } from '$app/navigation'
  import { page } from '$app/stores'
  import SearchIcon from '$lib/icons/SearchIcon.svelte'
  import XIcon from '$lib/icons/XIcon.svelte'

  let query = ($page.url.pathname.startsWith('/search') && $page.url.searchParams.get('q')) || ''

  let input: HTMLInputElement | undefined
</script>

<nav class="mx-2 mt-2 flex items-center gap-2 rounded bg-black p-2 px-3">
  <a href="/">Home</a>
  <a href="/tracks">Tracks</a>
  <a href="/releases">Releases</a>
  <a href="/artists">Artists</a>
  <a href="/downloads">Downloads</a>

  <form
    class="inline text-black"
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
      class="group ml-2 inline-flex items-center gap-2 rounded-full bg-gray-800 py-1 pl-3 pr-1 transition-all focus-within:bg-white"
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
        class="center h-6 w-6 rounded-full text-gray-600 opacity-0 transition hover:bg-gray-200 group-focus-within:opacity-100"
        on:click={() => (query = '')}
      >
        <XIcon class="h-4 w-4" />
      </button>
    </div>
    <button type="submit" class="hidden">Search</button>
  </form>
</nav>
