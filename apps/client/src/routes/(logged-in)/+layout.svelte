<script lang="ts">
  import { browser } from '$app/environment'
  import '@fontsource/inter/variable.css'
  import '@fontsource/noto-emoji'
  import { fade } from 'svelte/transition'

  import FriendsSidebar from '$lib/components/FriendsSidebar.svelte'
  import NavBar from '$lib/components/NavBar.svelte'
  import Player from '$lib/components/Player.svelte'
  import PlayerAudio from '$lib/components/PlayerAudio.svelte'
  import PlayerAudioAndroid from '$lib/components/PlayerAudioAndroid.svelte'
  import Queue from '$lib/components/Queue.svelte'
  import Dialogs from '$lib/dialogs/Dialogs.svelte'
  import { createLocalStorageJson } from '$lib/local-storage'
  import { player } from '$lib/now-playing'
  import Toaster from '$lib/toast/Toaster.svelte'

  import type { LayoutData } from './$types'

  export let data: LayoutData

  let showQueue = false

  const volume = createLocalStorageJson('volume', 1)
</script>

<div class="flex h-full w-full gap-2 bg-gray-800 p-2 text-white">
  <div class="flex min-w-0 flex-1 flex-col gap-2">
    <div class="order-3 md:order-1">
      <NavBar searchQuery={data.searchQuery} />
    </div>

    <main class="relative order-1 min-h-0 flex-1 md:order-2">
      <div class="relative h-full w-full overflow-auto">
        <slot />
      </div>
      {#if showQueue}
        <div class="absolute -bottom-2 -left-2 -right-2 -top-2 p-2">
          <div class="h-full w-full rounded shadow" transition:fade={{ duration: 150 }}>
            <Queue class="h-full w-full" />
          </div>
        </div>
      {/if}
      <Dialogs />
      <Toaster />
    </main>

    {#if $player.track}
      <div class="order-2 md:order-3">
        <Player
          track={$player.track}
          on:toggleQueue={() => (showQueue = !showQueue)}
          queueOpen={showQueue}
          bind:volume={$volume}
        />
      </div>
    {/if}
  </div>

  <div class="hidden xl:block">
    <FriendsSidebar />
  </div>
</div>

{#if browser}
  {#if window.Android}
    <PlayerAudioAndroid />
  {:else}
    <PlayerAudio volume={$volume} />
  {/if}
{/if}
