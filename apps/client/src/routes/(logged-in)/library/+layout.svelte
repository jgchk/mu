<script lang="ts">
  import { page } from '$app/stores'

  import LinkButton from '$lib/atoms/LinkButton.svelte'
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
  import { withSearchQuery } from './common'

  export let data: LayoutData

  $: clearSearchUrl = () => {
    const url = new URL($page.url)

    if (url.pathname === '/library/all') {
      url.pathname = '/library'
    }

    url.searchParams.delete('q')

    return url.toString()
  }
</script>

<div class="flex h-full flex-col gap-2 md:flex-row">
  <div
    class="order-2 flex w-full justify-around overflow-auto rounded bg-gray-900 md:order-1 md:w-48 md:flex-col md:justify-start md:py-2"
  >
    {#if data.searchQuery}
      <div class="w-full px-2">
        <LinkButton class="w-full" align="center" kind="outline" href={clearSearchUrl()}
          >Clear Search</LinkButton
        >
      </div>

      <div class="mx-2 my-2 h-px bg-gray-800" />

      <SidebarLink href={withSearchQuery('/library/all', data.searchQuery)} label="All">
        <ListIcon />
      </SidebarLink>

      <div class="mx-2 my-2 h-px bg-gray-800" />
    {/if}

    <SidebarLink href={withSearchQuery('/library/tracks', data.searchQuery)} label="Tracks">
      <MusicNoteIcon />
    </SidebarLink>
    <SidebarLink href={withSearchQuery('/library/releases', data.searchQuery)} label="Releases">
      <AlbumIcon />
    </SidebarLink>
    <SidebarLink href={withSearchQuery('/library/artists', data.searchQuery)} label="Artists">
      <PersonIcon />
    </SidebarLink>
    <SidebarLink href={withSearchQuery('/library/playlists', data.searchQuery)} label="Playlists">
      <CollectionIcon />
    </SidebarLink>

    {#if data.searchQuery}
      <div class="mx-2 my-2 h-px bg-gray-800" />

      <SidebarLink href={withSearchQuery('/library/soulseek', data.searchQuery)} label="Soulseek">
        <SoulseekIcon />
      </SidebarLink>
      <SidebarLink
        href={withSearchQuery('/library/soundcloud', data.searchQuery)}
        label="Soundcloud"
      >
        <SoundcloudIcon />
      </SidebarLink>
      <SidebarLink href={withSearchQuery('/library/spotify', data.searchQuery)} label="Spotify">
        <SpotifyIcon />
      </SidebarLink>
    {/if}
  </div>

  <div class="order-1 h-full flex-1 overflow-auto p-2 md:order-2">
    <slot />
  </div>
</div>
