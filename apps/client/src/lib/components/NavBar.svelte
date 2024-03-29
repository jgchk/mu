<script lang="ts">
  import { goto } from '$app/navigation'
  import { navigating, page } from '$app/stores'
  import { fade } from 'svelte/transition'

  import { tooltip } from '$lib/actions/tooltip'
  import Delay from '$lib/atoms/Delay.svelte'
  import Loader from '$lib/atoms/Loader.svelte'
  import LoaderLine from '$lib/atoms/LoaderLine.svelte'
  import CogIcon from '$lib/icons/CogIcon.svelte'
  import DownloadIcon from '$lib/icons/DownloadIcon.svelte'
  import LibraryIcon from '$lib/icons/LibraryIcon.svelte'
  import SearchIcon from '$lib/icons/SearchIcon.svelte'
  import TagIcon from '$lib/icons/TagIcon.svelte'
  import { useBreakpoint } from '$lib/utils/media-query'

  import NavLink from './NavLink.svelte'
  import SearchBar from './SearchBar.svelte'

  export let searchQuery: string | undefined

  const isMedium = useBreakpoint('md')
</script>

<nav
  class="flex items-center justify-around overflow-auto rounded text-white md:justify-start md:bg-black md:p-2 md:px-3"
>
  <NavLink label="Library" href="/library"><LibraryIcon /></NavLink>
  <NavLink label="Tags" href="/tags"><TagIcon /></NavLink>
  {#if !$isMedium}
    <NavLink label="Search" href="/search"><SearchIcon /></NavLink>
  {/if}
  <NavLink label="Downloads" href="/downloads"><DownloadIcon /></NavLink>
  <NavLink label="System" href="/system"><CogIcon /></NavLink>

  <div class="ml-2 hidden min-w-0 flex-1 md:inline">
    <SearchBar
      class="w-full max-w-fit"
      initialQuery={searchQuery}
      on:search={(e) => {
        if (e.detail.length > 0) {
          if ($page.url.pathname.startsWith('/library')) {
            const newURL = new URL($page.url)
            newURL.searchParams.set('q', e.detail)
            void goto(newURL.toString())
          } else {
            void goto(`/library?q=${e.detail}`)
          }
        } else {
          void goto('/library')
        }
      }}
    />
  </div>

  {#if $navigating}
    <Delay>
      <div
        class="ml-auto hidden pl-2 md:block"
        use:tooltip={{ content: 'Navigating...' }}
        in:fade|local
      >
        <Loader class="text-primary-500 h-6 w-6" />
      </div>
      <LoaderLine class="text-primary-500 fixed inset-0 top-0 md:hidden" />
    </Delay>
  {/if}
</nav>
