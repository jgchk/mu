<script lang="ts">
  import { QueryClientProvider } from '@tanstack/svelte-query'
  import type { LayoutData } from './$types'
  import { setContextClient } from '$lib/trpc'
  import '../app.css'

  export let data: LayoutData

  setContextClient(data.trpc)
</script>

<QueryClientProvider client={data.trpc.queryClient}>
  <div class="absolute top-0 left-0 h-screen w-screen bg-gray-800 text-white">
    <nav class="m-1 rounded bg-black p-1 px-2">
      <a href="/">Home</a>
      <a href="/tracks">Tracks</a>
    </nav>

    <slot />
  </div>
</QueryClientProvider>
