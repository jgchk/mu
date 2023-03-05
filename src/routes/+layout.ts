import { browser } from '$app/environment'
import { trpcClient } from '$lib/trpc'
import { QueryClient } from '@tanstack/svelte-query'
import type { LayoutLoad } from './$types'

export const load: LayoutLoad = async ({ fetch }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        enabled: browser,
      },
    },
  })

  const trpc = trpcClient(fetch)

  return { queryClient, trpc }
}
