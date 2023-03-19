import type { AppSubscriptionData } from 'trpc';

import type { RouterOutput } from '$lib/trpc';

export type FileSearchResponse = AppSubscriptionData<
  RouterOutput['search']['soulseekSubscription']
>;
