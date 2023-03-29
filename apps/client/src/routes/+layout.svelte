<script lang="ts">
  import '../app.css'
  import '@fontsource/inter/variable.css'

  import { QueryClientProvider } from '@tanstack/svelte-query'

  import NavBar from '$lib/components/NavBar.svelte'
  import Player from '$lib/components/Player.svelte'
  import { nowPlaying } from '$lib/now-playing'
  import { createToast, setContextToast } from '$lib/toast/toast'
  import Toaster from '$lib/toast/Toaster.svelte'
  import { setContextClient } from '$lib/trpc'

  import type { LayoutData } from './$types'

  export let data: LayoutData

  setContextClient(data.trpc)

  const toast = createToast()
  setContextToast(toast)
</script>

<QueryClientProvider client={data.trpc.queryClient}>
  <div class="absolute top-0 left-0 flex h-screen w-screen flex-col bg-gray-800 text-white">
    <NavBar />

    <main class="relative flex-1 overflow-auto">
      <Toaster />
      <slot />
    </main>

    {#if $nowPlaying}
      <div class="mx-2 mb-2">
        <Player nowPlaying={$nowPlaying} />
      </div>
    {/if}
  </div>
</QueryClientProvider>
