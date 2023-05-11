<script lang="ts">
  import AlbumIcon from '$lib/icons/AlbumIcon.svelte'
  import CollectionIcon from '$lib/icons/CollectionIcon.svelte'
  import MusicNoteIcon from '$lib/icons/MusicNoteIcon.svelte'
  import PersonIcon from '$lib/icons/PersonIcon.svelte'

  import LibraryLink from './LibraryLink.svelte'
</script>

<div class="flex h-full flex-col gap-2 md:flex-row">
  <div
    class="order-2 flex w-full justify-around overflow-auto rounded bg-gray-900 py-2 md:order-1 md:w-48 md:flex-col md:justify-start"
  >
    <LibraryLink href="/tracks" label="Tracks"><MusicNoteIcon /></LibraryLink>
    <LibraryLink href="/releases" label="Releases"><AlbumIcon /></LibraryLink>
    <LibraryLink href="/artists" label="Artists"><PersonIcon /></LibraryLink>
    <LibraryLink href="/playlists" label="Playlists"><CollectionIcon /></LibraryLink>

    {#if $$slots.sidebar}
      <div class="flex md:flex-col">
        <div class="pr-2 md:p-2 md:pr-2">
          <div class="h-full w-px bg-gray-800 md:h-px md:w-full" />
        </div>
        <slot name="sidebar" />
      </div>
    {/if}
  </div>

  <div class="order-1 h-full flex-1 overflow-auto p-2 md:order-2">
    <slot />
  </div>
</div>
