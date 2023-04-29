import { browser, dev } from '$app/environment'
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

const SERVER_HOST = import.meta.env.VITE_SERVER_HOST as string
const SERVER_PORT = import.meta.env.VITE_SERVER_PORT as string
const WS_PORT = import.meta.env.VITE_WS_PORT as string

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

  let url
  if (browser) {
    url = '/api/trpc'
  } else {
    url = `http://${SERVER_HOST}:${SERVER_PORT}/api/trpc`
  }

  const client = __createClient({
    queryClient,
    fetch: fetchFn,
    links: [
      ...(dev && browser ? [loggerLink()] : []),

      browser
        ? splitLink({
            condition: (op) => op.type === 'subscription',
            true: wsLink({
              client: createWSClient({ url: `ws://${SERVER_HOST}:${WS_PORT}` }),
            }),
            false: httpBatchLink({ url, fetch: fetchFn }),
          })
        : httpBatchLink({ url, fetch: fetchFn }),
    ],
    transformer: superjson,
  })

  return client
}
