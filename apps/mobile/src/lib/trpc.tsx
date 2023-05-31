import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { createTRPCReact } from '@trpc/react-query'
import Constants from 'expo-constants'
import type { FC, PropsWithChildren } from 'react'
import { useState } from 'react'
import superjson from 'superjson'
import type { AppRouter, AppRouterInput, AppRouterOutput } from 'trpc'

/**
 * A set of typesafe hooks for consuming your API.
 */
export const trpc = createTRPCReact<AppRouter>()
export type RouterInput = AppRouterInput
export type RouterOutput = AppRouterOutput

/**
 * Extend this function when going to production by
 * setting the baseUrl to your production API URL.
 */
const getBaseUrl = () => {
  /**
   * Gets the IP address of your host-machine. If it cannot automatically find it,
   * you'll have to manually set it. NOTE: Port 3000 should work for most but confirm
   * you don't have anything else running on it, or you'd have to change it.
   *
   * **NOTE**: This is only for development. In production, you'll want to set the
   * baseUrl to your production API URL.
   */
  const debuggerHost =
    Constants.manifest?.debuggerHost ?? Constants.manifest2?.extra?.expoGo?.debuggerHost
  const localhost = debuggerHost?.split(':')[0]
  console.log({ localhost })
  if (!localhost) {
    // return "https://your-production-url.com";
    throw new Error('Failed to get localhost. Please point to your production server.')
  }
  return `http://${localhost}:3001`
}

/**
 * A wrapper for your app that provides the TRPC context.
 * Use only in _app.tsx
 */
export const TRPCProvider: FC<PropsWithChildren> = ({ children }) => {
  const [queryClient] = useState(() => new QueryClient())
  const [trpcClient] = useState(() =>
    trpc.createClient({
      transformer: superjson,
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
        }),
      ],
    })
  )

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  )
}
