import { TRPC_ROUTE } from '$lib/server/config'
import { createContext } from '$lib/server/context'
import { appRouter } from '$lib/server/routers/_app'
import type { Handle } from '@sveltejs/kit'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'

export const handle = (async ({ event, resolve }) => {
  if (
    event.url.pathname.startsWith(TRPC_ROUTE) &&
    (event.request.method === 'GET' || event.request.method === 'POST')
  ) {
    return fetchRequestHandler({
      endpoint: TRPC_ROUTE,
      req: event.request,
      router: appRouter,
      createContext,
    })
  }

  return resolve(event)
}) satisfies Handle
