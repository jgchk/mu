<script lang="ts">
  import { page } from '$app/stores'

  import SearchBar from '$lib/components/SearchBar.svelte'
  import SidebarLink from '$lib/components/SidebarLink.svelte'
  import MusicNoteIcon from '$lib/icons/MusicNoteIcon.svelte'
  import SoulseekIcon from '$lib/icons/SoulseekIcon.svelte'
  import SoundcloudIcon from '$lib/icons/SoundcloudIcon.svelte'
  import SpotifyIcon from '$lib/icons/SpotifyIcon.svelte'

  const initialQuery = $page.url.searchParams.get('q') ?? undefined
</script>

<div class="flex h-full flex-col gap-2 md:flex-row">
  <div
    class="order-2 flex w-full justify-around overflow-auto rounded bg-gray-900 md:order-1 md:w-48 md:flex-col md:justify-start md:py-2"
  >
    <SidebarLink href="/search/tracks" label="Tracks"><MusicNoteIcon /></SidebarLink>
    <SidebarLink href="/search/soulseek" label="Soulseek"><SoulseekIcon /></SidebarLink>
    <SidebarLink href="/search/soundcloud" label="Soundcloud"><SoundcloudIcon /></SidebarLink>
    <SidebarLink href="/search/spotify" label="Spotify"><SpotifyIcon /></SidebarLink>
  </div>

  <div class="relative order-1 h-full flex-1 overflow-auto p-2 md:order-2">
    <SearchBar class="md:hidden" layer={800} {initialQuery} />
    <slot />
  </div>
</div>
