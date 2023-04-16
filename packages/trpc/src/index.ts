import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'
import type { Observable } from '@trpc/server/observable'

import type { AppRouter } from './routers/_app'

export { type AppRouter, appRouter } from './routers/_app'

export type AppRouterInput = inferRouterInputs<AppRouter>
export type AppRouterOutput = inferRouterOutputs<AppRouter>
export type AppSubscriptionData<S> = S extends Observable<infer T, unknown> ? T : never

export type {
  Context,
  ContextLastFm,
  ContextSlsk,
  ContextSpotify,
  ContextSpotifyErrors,
} from './context'
