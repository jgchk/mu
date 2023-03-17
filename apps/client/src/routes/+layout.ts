import { QueryClient } from '@tanstack/svelte-query';
import { createWSClient, httpBatchLink, loggerLink, splitLink, wsLink } from '@trpc/client';
import WebSocket from 'isomorphic-ws';
import superjson from 'superjson';

import { browser, dev } from '$app/environment';
import { createClient } from '$lib/trpc';

import type { LayoutLoad } from './$types';

export const load: LayoutLoad = ({ fetch }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        enabled: browser
      }
    }
  });

  const trpc = createClient({
    queryClient,
    fetch,
    links: [
      loggerLink({ enabled: () => dev }),

      // wsLink({
      //   client: wsClient,
      // }),

      // browser
      //   ? wsLink({
      //       client: wsClient,
      //     })
      //   : httpBatchLink({
      //       url: '/api/trpc',
      //       fetch,
      //     }),

      // httpBatchLink({
      //   url: '/api/trpc',
      //   fetch,
      // }),

      browser
        ? splitLink({
            condition: (op) => op.type === 'subscription',
            true: wsLink({
              client: createWSClient({
                url: `ws://localhost:8080`,
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-ignore
                WebSocket
              })
            }),
            false: httpBatchLink({
              url: '/api/trpc',
              fetch
            })
          })
        : httpBatchLink({
            url: '/api/trpc',
            fetch
          })
    ],
    transformer: superjson
  });

  return { trpc };
};
