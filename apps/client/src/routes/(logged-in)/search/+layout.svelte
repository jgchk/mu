<script lang="ts">
  import SearchBar from '$lib/components/SearchBar.svelte'
  import SidebarLink from '$lib/components/SidebarLink.svelte'
  import AlbumIcon from '$lib/icons/AlbumIcon.svelte'
  import CollectionIcon from '$lib/icons/CollectionIcon.svelte'
  import ListIcon from '$lib/icons/ListIcon.svelte'
  import MusicNoteIcon from '$lib/icons/MusicNoteIcon.svelte'
  import PersonIcon from '$lib/icons/PersonIcon.svelte'
  import SoulseekIcon from '$lib/icons/SoulseekIcon.svelte'
  import SoundcloudIcon from '$lib/icons/SoundcloudIcon.svelte'
  import SpotifyIcon from '$lib/icons/SpotifyIcon.svelte'

  import type { LayoutData } from './$types'
  import { withSearchQuery as withSearchQuery_ } from './common'

  export let data: LayoutData

  $: withSearchQuery = (pathname: string) => withSearchQuery_(pathname, data.searchQuery)
</script>

<div class="flex h-full flex-col gap-2 md:flex-row">
  <div
    class="order-2 flex w-full justify-around overflow-auto rounded bg-gray-900 md:order-1 md:w-48 md:flex-col md:justify-start md:py-2"
  >
    <SidebarLink href={withSearchQuery('/search/all')} label="All">
      <ListIcon />
    </SidebarLink>

    <div class="mx-2 my-2 h-px bg-gray-800" />

    <SidebarLink href={withSearchQuery('/search/tracks')} label="Tracks">
      <MusicNoteIcon />
    </SidebarLink>
    <SidebarLink href={withSearchQuery('/search/releases')} label="Releases">
      <AlbumIcon />
    </SidebarLink>
    <SidebarLink href={withSearchQuery('/search/artists')} label="Artists">
      <PersonIcon />
    </SidebarLink>
    <SidebarLink href={withSearchQuery('/search/playlists')} label="Playlists">
      <CollectionIcon />
    </SidebarLink>

    <div class="mx-2 my-2 h-px bg-gray-800" />

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
