import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { createTRPCReact } from '@trpc/react-query'
import type { FC, PropsWithChildren } from 'react'
import { useMemo, useState } from 'react'
import superjson from 'superjson'
import type { AppRouter, AppRouterInput, AppRouterOutput } from 'trpc'

import type { AuthContext } from './contexts/AuthContext'
import { getBaseUrl } from './url'

/**
 * A set of typesafe hooks for consuming your API.
 */
export const trpc = createTRPCReact<AppRouter>()
export type RouterInput = AppRouterInput
export type RouterOutput = AppRouterOutput

/**
 * A wrapper for your app that provides the TRPC context.
 * Use only in _app.tsx
 */
export const TRPCProvider: FC<PropsWithChildren<AuthContext>> = ({ children, token }) => {
  const [queryClient] = useState(() => new QueryClient())
  const trpcClient = useMemo(
    () =>
      trpc.createClient({
        transformer: superjson,
        links: [
          httpBatchLink({
            url: `${getBaseUrl()}/api/trpc`,
            headers: {
              Cookie: token.status === 'loaded' ? `session_token=${token.value}` : undefined,
            },
            maxURLLength: 2083,
          }),
        ],
      }),
    [token]
  )

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  )
}
