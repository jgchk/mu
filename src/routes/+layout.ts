import { QueryClient } from '@tanstack/svelte-query'
import { httpBatchLink, loggerLink } from '@trpc/client'
import superjson from 'superjson'

import { browser, dev } from '$app/environment'
import { createClient } from '$lib/trpc'

import type { LayoutLoad } from './$types'

export const load: LayoutLoad = ({ fetch }) => {
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
        url: '/api/trpc',
        fetch,
      }),
    ],
    transformer: superjson,
  })

  return { trpc }
}
