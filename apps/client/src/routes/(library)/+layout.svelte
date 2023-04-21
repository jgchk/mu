<script lang="ts">
  import LibraryLink from './LibraryLink.svelte'
</script>

<div class="flex h-full gap-2">
  <div class="w-48 min-w-fit rounded bg-gray-900 py-2">
    <LibraryLink href="/artists">Artists</LibraryLink>
    <LibraryLink href="/releases">Releases</LibraryLink>
    <LibraryLink href="/tracks">Tracks</LibraryLink>

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
