<script lang="ts">
  import '../app.css';

  import { QueryClientProvider } from '@tanstack/svelte-query';

  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { setContextClient } from '$lib/trpc';

  import type { LayoutData } from './$types';

  export let data: LayoutData;

  setContextClient(data.trpc);

  let query = ($page.url.pathname === '/search' && $page.url.searchParams.get('q')) || '';
</script>

<QueryClientProvider client={data.trpc.queryClient}>
  <div
    class="absolute top-0 left-0 flex h-screen w-screen flex-col gap-1 bg-gray-800 p-1 text-white"
  >
    <nav class="rounded bg-black p-1 px-2">
      <a href="/">Home</a>
      <a href="/tracks">Tracks</a>
      <a href="/releases">Releases</a>
      <a href="/downloads">Downloads</a>

      <form
        class="inline text-black"
        on:submit|preventDefault={() => {
          if (query.length > 0) {
            void goto(`/search?q=${query}`);
          }
        }}
      >
        <input type="text" bind:value={query} />
        <button type="submit">Search</button>
      </form>
    </nav>

    <main class="flex-1 overflow-auto">
      <slot />
    </main>
  </div>
</QueryClientProvider>
