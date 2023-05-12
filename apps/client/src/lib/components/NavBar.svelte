<script lang="ts">
  import { navigating, page } from '$app/stores'
  import { onMount } from 'svelte'
  import { fade } from 'svelte/transition'

  import { tooltip } from '$lib/actions/tooltip'
  import Delay from '$lib/atoms/Delay.svelte'
  import Loader from '$lib/atoms/Loader.svelte'
  import CogIcon from '$lib/icons/CogIcon.svelte'
  import DownloadIcon from '$lib/icons/DownloadIcon.svelte'
  import LibraryIcon from '$lib/icons/LibraryIcon.svelte'
  import SearchIcon from '$lib/icons/SearchIcon.svelte'
  import TagIcon from '$lib/icons/TagIcon.svelte'

  import NavLink from './NavLink.svelte'
  import SearchBar from './SearchBar.svelte'

  let query = ''
  onMount(() => {
    const unsubscribe = page.subscribe((page) => {
      query = (page.url.pathname.startsWith('/search') && page.url.searchParams.get('q')) || ''
    })
    return () => unsubscribe()
  })
</script>

<nav
  class="flex items-center justify-around overflow-auto rounded text-white md:justify-start md:bg-black md:p-2 md:px-3"
>
  <NavLink label="Library" href="/artists" otherMatches={['/playlists', '/releases', '/tracks']}>
    <LibraryIcon />
  </NavLink>
  <NavLink label="Tags" href="/tags"><TagIcon /></NavLink>
  <NavLink label="Search" href="/search"><SearchIcon /></NavLink>
  <NavLink label="Downloads" href="/downloads"><DownloadIcon /></NavLink>
  <NavLink label="System" href="/system"><CogIcon /></NavLink>

  <SearchBar {query} />

  {#if $navigating}
    <Delay>
      <div
        class="pointer-events-none ml-auto"
        use:tooltip={{ content: 'Navigating...' }}
        in:fade|local
      >
        <Loader class="text-primary-500 h-6 w-6" />
      </div>
    </Delay>
  {/if}
</nav>
