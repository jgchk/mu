<script lang="ts">
  import SidebarLink from '$lib/components/SidebarLink.svelte'
  import AlbumIcon from '$lib/icons/AlbumIcon.svelte'
  import CollectionIcon from '$lib/icons/CollectionIcon.svelte'
  import MusicNoteIcon from '$lib/icons/MusicNoteIcon.svelte'
  import PersonIcon from '$lib/icons/PersonIcon.svelte'
</script>

<div class="flex h-full flex-col gap-2 md:flex-row">
  <div
    class="order-2 flex w-full justify-around overflow-auto rounded bg-gray-900 md:order-1 md:w-48 md:flex-col md:justify-start md:py-2"
  >
    <SidebarLink href="/library/tracks" label="Tracks"><MusicNoteIcon /></SidebarLink>
    <SidebarLink href="/library/releases" label="Releases"><AlbumIcon /></SidebarLink>
    <SidebarLink href="/library/artists" label="Artists"><PersonIcon /></SidebarLink>
    <SidebarLink href="/library/playlists" label="Playlists"><CollectionIcon /></SidebarLink>
  </div>

  <div class="order-1 h-full flex-1 overflow-auto p-2 md:order-2">
    <slot />
  </div>
</div>
