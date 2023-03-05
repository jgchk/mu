import type { Handle } from '@sveltejs/kit'
import { TRPC_ROUTE } from './server/config'
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { createContext } from './server/context'
import { appRouter } from './server/routers/_app'

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
