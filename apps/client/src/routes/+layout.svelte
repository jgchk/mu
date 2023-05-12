<script lang="ts">
  import '@fontsource/inter/variable.css'
  import '@fontsource/noto-emoji'
  import { QueryClientProvider } from '@tanstack/svelte-query'
  import { onMount } from 'svelte'
  import { fade } from 'svelte/transition'
  import { toErrorString } from 'utils'

  import FriendsSidebar from '$lib/components/FriendsSidebar.svelte'
  import NavBar from '$lib/components/NavBar.svelte'
  import Player from '$lib/components/Player.svelte'
  import Queue from '$lib/components/Queue.svelte'
  import Dialogs from '$lib/dialogs/Dialogs.svelte'
  import { setContextDialogs } from '$lib/dialogs/dialogs'
  import { nowPlaying } from '$lib/now-playing'
  import Toaster from '$lib/toast/Toaster.svelte'
  import { createToast, setContextToast } from '$lib/toast/toast'
  import type { ErrorToastEvent } from '$lib/trpc'
  import { setContextClient } from '$lib/trpc'

  import '../app.css'
  import type { LayoutData } from './$types'

  export let data: LayoutData

  onMount(() => {
    const listener = (e: ErrorToastEvent) => {
      const errorString = toErrorString(e.detail.error)
      if (errorString === 'NetworkError when attempting to fetch resource.') {
        const offlineMessage = 'Cannot reach server. Are you offline?'
        if (!$toast.some((toast) => toast.msg === offlineMessage)) {
          toast.error(offlineMessage, { duration: Infinity })
        }
      } else {
        toast.error(errorString)
      }
    }

    // @ts-expect-error custom event
    window.addEventListener('error-toast', listener)

    return () => {
      // @ts-expect-error custom event
      window.removeEventListener('error-toast', listener)
    }
  })

  setContextClient(data.trpc)

  const toast = createToast()
  setContextToast(toast)

  setContextDialogs()

  let showQueue = false
</script>

<QueryClientProvider client={data.trpc.queryClient}>
  <div class="flex h-full w-full gap-2 bg-gray-800 p-2 text-white">
    <div class="flex min-w-0 flex-1 flex-col gap-2">
      <div class="order-3 md:order-1">
        <NavBar />
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

      {#if $nowPlaying.track}
        <div class="order-2 md:order-3">
          <Player
            track={$nowPlaying.track}
            on:toggleQueue={() => (showQueue = !showQueue)}
            queueOpen={showQueue}
          />
        </div>
      {/if}
    </div>

    <div class="hidden lg:block">
      <FriendsSidebar />
    </div>
  </div>
</QueryClientProvider>
