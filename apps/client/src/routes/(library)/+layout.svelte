<script lang="ts">
  import AlbumIcon from '$lib/icons/AlbumIcon.svelte'
  import CollectionIcon from '$lib/icons/CollectionIcon.svelte'
  import MusicNoteIcon from '$lib/icons/MusicNoteIcon.svelte'
  import PersonIcon from '$lib/icons/PersonIcon.svelte'

  import LibraryLink from './LibraryLink.svelte'
</script>

<div class="flex h-full gap-2 flex-col md:flex-row">
  <div
    class="overflow-auto rounded bg-gray-900 py-2 order-2 md:order-1 flex md:flex-col w-full md:w-48 justify-around md:justify-start"
  >
    <LibraryLink href="/playlists" label="Playlists"><CollectionIcon /></LibraryLink>
    <LibraryLink href="/artists" label="Artists"><PersonIcon /></LibraryLink>
    <LibraryLink href="/releases" label="Releases"><AlbumIcon /></LibraryLink>
    <LibraryLink href="/tracks" label="Tracks"><MusicNoteIcon /></LibraryLink>

    <div class="flex md:flex-col">
      {#if $$slots.sidebar}
        <div class="pr-2 md:pr-2 md:p-2">
          <div class="w-px h-full md:w-full md:h-px bg-gray-800" />
        </div>
        <slot name="sidebar" />
      {/if}
    </div>
  </div>

  <div class="h-full flex-1 overflow-auto order-1 md:order-2">
    <slot />
  </div>
</div>
