import { createTRPCSvelte } from '@jgchk/trpc-svelte-query';
import type { AppRouter, AppRouterInput, AppRouterOutput } from 'trpc';

export const { createClient, setContextClient, getContextClient } = createTRPCSvelte<AppRouter>();

export type RouterInput = AppRouterInput;
export type RouterOutput = AppRouterOutput;
