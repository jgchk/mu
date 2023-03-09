import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'
import { createTRPCSvelte } from '@trpc/svelte-query'

import type { AppRouter } from './server/routers/_app'

export const { createClient, setContextClient, getContextClient } = createTRPCSvelte<AppRouter>()

export type RouterInput = inferRouterInputs<AppRouter>
export type RouterOutput = inferRouterOutputs<AppRouter>
