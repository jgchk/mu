<script lang="ts">
  import { page } from '$app/stores'

  import SearchBar from '$lib/components/SearchBar.svelte'
  import SoulseekIcon from '$lib/icons/SoulseekIcon.svelte'
  import SoundcloudIcon from '$lib/icons/SoundcloudIcon.svelte'
  import SpotifyIcon from '$lib/icons/SpotifyIcon.svelte'

  import ServiceLink from './ServiceLink.svelte'

  const initialQuery = $page.url.searchParams.get('q') ?? undefined
</script>

<div class="flex h-full flex-col gap-2 md:flex-row">
  <div
    class="order-2 flex w-full items-center justify-around overflow-auto rounded bg-gray-900 md:order-1 md:w-48 md:flex-col md:justify-start md:py-2"
  >
    <ServiceLink service="Soulseek">
      <SoulseekIcon />
    </ServiceLink>
    <ServiceLink service="Soundcloud">
      <SoundcloudIcon />
    </ServiceLink>
    <ServiceLink service="Spotify">
      <SpotifyIcon />
    </ServiceLink>
  </div>

  <div class="relative order-1 h-full flex-1 overflow-auto p-2 md:order-2">
    <SearchBar class="md:hidden" layer={800} {initialQuery} />
    <slot />
  </div>
</div>
