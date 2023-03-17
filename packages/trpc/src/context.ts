import type { inferAsyncReturnType } from '@trpc/server';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface CreateContextOptions {
  // session: Session | null
}

/**
 * Inner function for `createContext` where we create the context.
 * This is useful for testing when we don't want to mock Next.js' request/response
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function createContextInner(_opts: CreateContextOptions) {
  return {};
}

export type Context = inferAsyncReturnType<typeof createContextInner>;

/**
 * Creates context for an incoming request
 * @link https://trpc.io/docs/context
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function createContext(): Context {
  // for API-response caching see https://trpc.io/docs/caching

  return createContextInner({});
}
