import { browser, dev } from '$app/environment'
import type { LoadEvent } from '@sveltejs/kit'
import { createTRPCProxyClient, httpBatchLink, loggerLink } from '@trpc/client'
import superjson from 'superjson'
import { TRPC_ROUTE } from '../server/config'
import { env } from '../server/env'
import type { AppRouter } from '../server/routers/_app'

export const trpc = (loadFetch?: LoadEvent['fetch']) =>
  createTRPCProxyClient<AppRouter>({
    links: [
      loggerLink({ enabled: () => dev }),
      httpBatchLink({
        // The port isn't constant by default, so we have set it to 3000 in vite.config.js for tRPC server-side fetches.
        url: loadFetch || browser ? TRPC_ROUTE : `http://localhost:${env.PUBLIC_PORT}${TRPC_ROUTE}`,
        ...(loadFetch && { fetch: loadFetch }),
      }),
    ],
    transformer: superjson,
  })
