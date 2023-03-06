import { browser, dev } from '$app/environment'
import { QueryClient } from '@tanstack/svelte-query'
import { httpBatchLink, loggerLink } from '@trpc/client'
import { TRPC_ROUTE } from '../server/config'
import type { LayoutLoad } from './$types'
import superjson from 'superjson'
import { createTRPCSvelte } from '@trpc/svelte-query'
import type { AppRouter } from '../server/routers/_app'

export const load: LayoutLoad = async ({ fetch }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        enabled: browser,
      },
    },
  })

  const trpc = createTRPCSvelte<AppRouter>({
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
