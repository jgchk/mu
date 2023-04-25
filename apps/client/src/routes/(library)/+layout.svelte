<script lang="ts">
  import AlbumIcon from '$lib/icons/AlbumIcon.svelte'
  import CollectionIcon from '$lib/icons/CollectionIcon.svelte'
  import MusicNoteIcon from '$lib/icons/MusicNoteIcon.svelte'
  import PersonIcon from '$lib/icons/PersonIcon.svelte'

  import LibraryLink from './LibraryLink.svelte'
</script>

<div class="flex h-full gap-2">
  <div class="w-48 overflow-auto rounded bg-gray-900 py-2">
    <LibraryLink href="/playlists" label="Playlists"><CollectionIcon /></LibraryLink>
    <LibraryLink href="/artists" label="Artists"><PersonIcon /></LibraryLink>
    <LibraryLink href="/releases" label="Releases"><AlbumIcon /></LibraryLink>
    <LibraryLink href="/tracks" label="Tracks"><MusicNoteIcon /></LibraryLink>

    {#if $$slots.sidebar}
      <div class="p-2">
        <div class="h-px bg-gray-800" />
      </div>
      <slot name="sidebar" />
    {/if}
  </div>

  <div class="h-full flex-1 overflow-auto">
    <slot />
  </div>
</div>
