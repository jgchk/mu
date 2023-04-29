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
    const serverHost = process.env.SERVER_HOST
    const serverPort = process.env.SERVER_PORT
    if (!serverHost) {
      throw new Error('SERVER_HOST not set')
    }
    if (!serverPort) {
      throw new Error('SERVER_PORT not set')
    }
    url = `http://${serverHost}:${serverPort}/api/trpc`
  }

  const client = __createClient({
    queryClient,
    fetch: fetchFn,
    links: [
      ...(dev ? [loggerLink()] : []),

      browser
        ? splitLink({
            condition: (op) => op.type === 'subscription',
            true: wsLink({ client: createWSClient({ url: `ws://localhost:8080` }) }),
            false: httpBatchLink({ url, fetch: fetchFn }),
          })
        : httpBatchLink({ url, fetch: fetchFn }),
    ],
    transformer: superjson,
  })

  return client
}
