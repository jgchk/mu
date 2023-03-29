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
  <div class="flex h-full w-full flex-col gap-2 bg-gray-800 p-2 text-white">
    <NavBar />

    <main class="relative flex-1 overflow-auto">
      <Toaster />
      <slot />
    </main>

    {#if $nowPlaying}
      <Player nowPlaying={$nowPlaying} />
    {/if}
  </div>
</QueryClientProvider>
