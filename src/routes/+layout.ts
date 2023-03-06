import { browser, dev } from '$app/environment'
import { QueryClient } from '@tanstack/svelte-query'
import { httpBatchLink, loggerLink } from '@trpc/client'
import { TRPC_ROUTE } from '../server/config'
import type { LayoutLoad } from './$types'
import superjson from 'superjson'
import { createClient } from '$lib/trpc'

export const load: LayoutLoad = async ({ fetch }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        enabled: browser,
      },
    },
  })

  const trpc = createClient({
    queryClient,
    fetch,
    links: [
      loggerLink({ enabled: () => dev }),
      httpBatchLink({
        url: TRPC_ROUTE,
        fetch,
      }),
    ],
    transformer: superjson,
  })

  return { trpc }
}
