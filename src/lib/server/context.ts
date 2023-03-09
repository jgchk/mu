import type { inferAsyncReturnType } from '@trpc/server'
import type { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface CreateContextOptions {
  // session: Session | null
}

/**
 * Inner function for `createContext` where we create the context.
 * This is useful for testing when we don't want to mock Next.js' request/response
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function createContextInner(_opts: CreateContextOptions) {
  return {}
}

export type Context = inferAsyncReturnType<typeof createContextInner>

/**
 * Creates context for an incoming request
 * @link https://trpc.io/docs/context
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function createContext(_opts: FetchCreateContextFnOptions): Promise<Context> {
  // for API-response caching see https://trpc.io/docs/caching

  return await createContextInner({})
}
