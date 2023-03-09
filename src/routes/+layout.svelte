<script lang="ts">
  import { QueryClientProvider } from '@tanstack/svelte-query'
  import type { LayoutData } from './$types'
  import { setContextClient } from '$lib/trpc'
  import '../app.css'

  export let data: LayoutData

  setContextClient(data.trpc)
</script>

<QueryClientProvider client={data.trpc.queryClient}>
  <div
    class="absolute top-0 left-0 flex h-screen w-screen flex-col gap-1 bg-gray-800 p-1 text-white"
  >
    <nav class="rounded bg-black p-1 px-2">
      <a href="/">Home</a>
      <a href="/tracks">Tracks</a>
    </nav>

    <main class="flex-1 overflow-auto">
      <slot />
    </main>
  </div>
</QueryClientProvider>
