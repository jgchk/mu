import { createTRPCSvelte } from '@trpc/svelte-query'
import type { AppRouter } from '../server/routers/_app'

export const { createClient, setContextClient, getContextClient } = createTRPCSvelte<AppRouter>()
