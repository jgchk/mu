<script lang="ts">
  import SearchBar from '$lib/components/SearchBar.svelte'
  import SidebarLink from '$lib/components/SidebarLink.svelte'
  import AlbumIcon from '$lib/icons/AlbumIcon.svelte'
  import MusicNoteIcon from '$lib/icons/MusicNoteIcon.svelte'
  import SoulseekIcon from '$lib/icons/SoulseekIcon.svelte'
  import SoundcloudIcon from '$lib/icons/SoundcloudIcon.svelte'
  import SpotifyIcon from '$lib/icons/SpotifyIcon.svelte'

  import type { LayoutData } from './$types'

  export let data: LayoutData

  $: withSearchQuery = (pathname: string) => {
    let url = pathname
    if (data.searchQuery) {
      url += `?q=${data.searchQuery}`
    }
    return url
  }
</script>

<div class="flex h-full flex-col gap-2 md:flex-row">
  <div
    class="order-2 flex w-full justify-around overflow-auto rounded bg-gray-900 md:order-1 md:w-48 md:flex-col md:justify-start md:py-2"
  >
    <SidebarLink href={withSearchQuery('/search/tracks')} label="Tracks">
      <MusicNoteIcon />
    </SidebarLink>
    <SidebarLink href={withSearchQuery('/search/releases')} label="Releases">
      <AlbumIcon />
    </SidebarLink>

    <SidebarLink href={withSearchQuery('/search/soulseek')} label="Soulseek">
      <SoulseekIcon />
    </SidebarLink>
    <SidebarLink href={withSearchQuery('/search/soundcloud')} label="Soundcloud">
      <SoundcloudIcon />
    </SidebarLink>
    <SidebarLink href={withSearchQuery('/search/spotify')} label="Spotify">
      <SpotifyIcon />
    </SidebarLink>
  </div>

  <div class="relative order-1 h-full flex-1 overflow-auto p-2 md:order-2">
    <SearchBar class="md:hidden" layer={800} initialQuery={data.searchQuery} />
    <slot />
  </div>
</div>
