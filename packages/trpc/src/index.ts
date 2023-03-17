import { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import { Observable } from '@trpc/server/observable';
import type { AppRouter } from './routers/_app';

export { appRouter, type AppRouter } from './routers/_app';

export type AppRouterInput = inferRouterInputs<AppRouter>;
export type AppRouterOutput = inferRouterOutputs<AppRouter>;
export type AppSubscriptionData<S> = S extends Observable<infer T, unknown> ? T : never;
