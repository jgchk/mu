import type { inferSvelteQueryProcedureOptions } from '@jgchk/trpc-svelte-query'
import {
  createTRPCSvelte,
  createWSClient,
  httpBatchLink,
  loggerLink,
  splitLink,
  wsLink,
} from '@jgchk/trpc-svelte-query'
import { MutationCache, QueryCache, QueryClient } from '@tanstack/svelte-query'
import superjson from 'superjson'
import type { AppRouter, AppRouterInput, AppRouterOutput } from 'trpc'

import { browser, dev } from '$app/environment'

export const {
  createClient: __createClient,
  setContextClient,
  getContextClient,
} = createTRPCSvelte<AppRouter>()

export type TRPCClient = ReturnType<typeof __createClient>
export type RouterInput = AppRouterInput
export type RouterOutput = AppRouterOutput
export type RouterOptions = inferSvelteQueryProcedureOptions<AppRouter>

export type ErrorToastEvent = CustomEvent<{
  error: unknown
}>

const onErrorToast = (error: unknown) => {
  const event: ErrorToastEvent = new CustomEvent('error-toast', {
    detail: {
      error,
    },
  })

  window.dispatchEvent(event)
}

export const createClient = (fetchFn: typeof fetch) => {
  const queryClient = new QueryClient({
    queryCache: browser
      ? new QueryCache({
          onError: (error, query) => {
            if (query.options.showToast) {
              onErrorToast(error)
            }
          },
        })
      : undefined,
    mutationCache: browser
      ? new MutationCache({
          onError: (error, variables, context, mutation) => {
            if (mutation.options.showToast) {
              onErrorToast(error)
            }
          },
        })
      : undefined,
    defaultOptions: {
      queries: {
        showToast: true,
        enabled: browser,
      },
      mutations: {
        showToast: true,
      },
    },
  })

  const client = __createClient({
    queryClient,
    fetch: fetchFn,
    links: [
      loggerLink({ enabled: () => dev }),

      browser
        ? splitLink({
            condition: (op) => op.type === 'subscription',
            true: wsLink({
              client: createWSClient({
                url: `ws://localhost:8080`,
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                WebSocket,
              }),
            }),
            false: httpBatchLink({
              url: '/api/trpc',
              fetch: fetchFn,
            }),
          })
        : httpBatchLink({
            url: '/api/trpc',
            fetch: fetchFn,
          }),
    ],
    transformer: superjson,
  })

  return client
}
