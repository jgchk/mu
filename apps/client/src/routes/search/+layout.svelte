<script lang="ts">
  import ServiceLink from '$lib/components/ServiceLink.svelte'
  import SoulseekIcon from '$lib/icons/SoulseekIcon.svelte'
  import SoundcloudIcon from '$lib/icons/SoundcloudIcon.svelte'
  import SpotifyIcon from '$lib/icons/SpotifyIcon.svelte'
</script>

<div class="flex h-full gap-2">
  <div class="w-48 min-w-fit rounded bg-gray-900 py-2">
    <ServiceLink service="Spotify">
      <SpotifyIcon />
    </ServiceLink>
    <ServiceLink service="Soundcloud">
      <SoundcloudIcon />
    </ServiceLink>
    <ServiceLink service="Soulseek">
      <SoulseekIcon />
    </ServiceLink>
  </div>

  <div class="h-full flex-1 overflow-auto">
    <slot />
  </div>
</div>
