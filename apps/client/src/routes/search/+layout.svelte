<script lang="ts">
  import SoulseekIcon from '$lib/icons/SoulseekIcon.svelte'
  import SoundcloudIcon from '$lib/icons/SoundcloudIcon.svelte'
  import SpotifyIcon from '$lib/icons/SpotifyIcon.svelte'

  import ServiceLink from './ServiceLink.svelte'
</script>

<div class="flex h-full gap-2">
  <div class="w-48 overflow-auto rounded bg-gray-900 py-2">
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

  <div class="h-full flex-1 overflow-auto">
    <slot />
  </div>
</div>
