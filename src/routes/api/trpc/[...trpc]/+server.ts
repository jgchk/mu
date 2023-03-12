import { fetchRequestHandler } from '@trpc/server/adapters/fetch'

import { createContext } from '$lib/server/context'
import { appRouter } from '$lib/server/routers/_app'

import type { RequestHandler } from './$types'

const handler: RequestHandler = async ({ request }) => {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req: request,
    router: appRouter,
    createContext,
    onError: ({ error }) => {
      if (error.code === 'INTERNAL_SERVER_ERROR') {
        console.error(error)
      }
    },
  })
}

export const GET = handler
export const POST = handler
