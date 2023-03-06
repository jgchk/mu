import { createTRPCSvelte } from '@trpc/svelte-query'
import type { AppRouter } from '../server/routers/_app'

const { createClient, setContextClient, getContextClient } = createTRPCSvelte<AppRouter>()
export { createClient, setContextClient, getContextClient }
