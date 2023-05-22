import { browser, dev } from '$app/environment'
import { goto } from '$app/navigation'
import {
  createTRPCSvelte,
  createWSClient,
  httpBatchLink,
  loggerLink,
  splitLink,
  wsLink,
} from '@jgchk/trpc-svelte-query'
import type {
  HttpBatchLinkOptions,
  inferSvelteQueryProcedureOptions,
} from '@jgchk/trpc-svelte-query'
import { MutationCache, QueryCache, QueryClient } from '@tanstack/svelte-query'
import superjson from 'superjson'
import type { AppRouter, AppRouterInput, AppRouterOutput } from 'trpc'
import { withUrlUpdate } from 'utils/browser'

import { getHost } from './host'
import { notLoggedInError } from './strings'

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
            if (error instanceof Error && error.message === notLoggedInError()) {
              void goto('/login')
            }

            if (query.options.showToast) {
              onErrorToast(error)
            }
          },
        })
      : undefined,
    mutationCache: browser
      ? new MutationCache({
          onError: (error, variables, context, mutation) => {
            if (error instanceof Error && error.message === notLoggedInError()) {
              void goto('/login')
            }

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
    url = `${getHost()}/api/trpc`
  }

  const httpBatchLinkOpts: HttpBatchLinkOptions = { url, fetch: fetchFn, maxURLLength: 2083 }

  const client = __createClient({
    queryClient,
    fetch: fetchFn,
    links: [
      ...(dev && browser ? [loggerLink()] : []),

      browser
        ? splitLink({
            condition: (op) => op.type === 'subscription',
            true: wsLink({
              client: createWSClient({
                url: withUrlUpdate(new URL(location.href), (url) => {
                  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
                  url.pathname = '/api/trpc'
                  url.search = ''
                }).toString(),
              }),
            }),
            false: httpBatchLink(httpBatchLinkOpts),
          })
        : httpBatchLink(httpBatchLinkOpts),
    ],
    transformer: superjson,
  })

  return client
}
