<script lang="ts">
  import { goto } from '$app/navigation'
  import { navigating, page } from '$app/stores'
  import { tooltip } from '$lib/actions/tooltip'
  import Loader from '$lib/atoms/Loader.svelte'
  import SearchIcon from '$lib/icons/SearchIcon.svelte'
  import XIcon from '$lib/icons/XIcon.svelte'
  import { cn } from '$lib/utils/classes'
  import type { Timeout } from '$lib/utils/types'

  import NavLink from './NavLink.svelte'

  let query = ($page.url.pathname.startsWith('/search') && $page.url.searchParams.get('q')) || ''

  let input: HTMLInputElement | undefined

  const DELAYED_NAV_THRESHOLD = 500
  let delayedNavTimeout: Timeout | undefined
  let delayedNav = false
  $: {
    if ($navigating) {
      if (delayedNavTimeout) {
        clearTimeout(delayedNavTimeout)
      }
      delayedNavTimeout = setTimeout(() => {
        delayedNavTimeout = undefined
        delayedNav = true
      }, DELAYED_NAV_THRESHOLD)
    } else {
      if (delayedNavTimeout) {
        clearTimeout(delayedNavTimeout)
        delayedNavTimeout = undefined
      }
      delayedNav = false
    }
  }
</script>

<nav class="flex items-center rounded bg-black p-2 px-3 text-white">
  <NavLink href="/">Home</NavLink>
  <NavLink href="/tracks">Tracks</NavLink>
  <NavLink href="/releases">Releases</NavLink>
  <NavLink href="/artists">Artists</NavLink>
  <NavLink href="/downloads">Downloads</NavLink>

  <form
    class="inline"
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

  <div
    class={cn('ml-auto transition', delayedNav ? 'opacity-100' : 'pointer-events-none opacity-0')}
    use:tooltip={{ content: 'Navigating...' }}
  >
    <Loader class="text-primary-500 h-6 w-6" />
  </div>
</nav>