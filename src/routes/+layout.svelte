<script lang="ts">
  import { QueryClientProvider } from '@tanstack/svelte-query'
  import type { LayoutData } from './$types'
  import { setContextClient } from '$lib/trpc'

  export let data: LayoutData

  setContextClient(data.trpc)
</script>

<QueryClientProvider client={data.trpc.queryClient}>
  <slot />
</QueryClientProvider>
