<script lang="ts">
  import '../app.css'
  import '@fontsource/inter/variable.css'
  import '@fontsource/noto-emoji'

  import { QueryClientProvider } from '@tanstack/svelte-query'
  import { onMount } from 'svelte'

  import FriendsSidebar from '$lib/components/FriendsSidebar.svelte'
  import NavBar from '$lib/components/NavBar.svelte'
  import Player from '$lib/components/Player.svelte'
  import { nowPlaying } from '$lib/now-playing'
  import { createToast, setContextToast } from '$lib/toast/toast'
  import Toaster from '$lib/toast/Toaster.svelte'
  import type { ErrorToastEvent } from '$lib/trpc'
  import { setContextClient } from '$lib/trpc'
  import { toErrorString } from '$lib/utils/error'

  import type { LayoutData } from './$types'

  export let data: LayoutData

  onMount(() => {
    const listener = (e: ErrorToastEvent) => {
      const errorString = toErrorString(e.detail.error)
      if (errorString === 'NetworkError when attempting to fetch resource.') {
        const offlineMessage = 'You are offline. Please check your internet connection.'
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
</script>

<QueryClientProvider client={data.trpc.queryClient}>
  <div class="flex h-full w-full gap-2 bg-gray-800 p-2 text-white">
    <div class="flex min-w-0 flex-1 flex-col gap-2">
      <NavBar />

      <main class="relative flex-1 overflow-auto">
        <slot />
        <Toaster />
      </main>

      {#if $nowPlaying.track}
        <Player track={$nowPlaying.track} />
      {/if}
    </div>

    <FriendsSidebar />
  </div>
</QueryClientProvider>
