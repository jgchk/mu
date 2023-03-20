<script lang="ts">
  import '../app.css';

  import { QueryClientProvider } from '@tanstack/svelte-query';

  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import Player from '$lib/components/Player.svelte';
  import { nowPlaying } from '$lib/now-playing';
  import { setContextClient } from '$lib/trpc';

  import type { LayoutData } from './$types';

  export let data: LayoutData;

  setContextClient(data.trpc);

  let query = ($page.url.pathname === '/search' && $page.url.searchParams.get('q')) || '';
</script>

<QueryClientProvider client={data.trpc.queryClient}>
  <div class="absolute top-0 left-0 flex h-screen w-screen flex-col bg-gray-800 text-white">
    <nav class="mx-1 mt-1 rounded bg-black p-1 px-2">
      <a href="/">Home</a>
      <a href="/tracks">Tracks</a>
      <a href="/releases">Releases</a>
      <a href="/downloads">Downloads</a>

      <form
        class="inline text-black"
        on:submit|preventDefault={() => {
          if (query.length > 0) {
            if ($page.url.pathname.startsWith('/search')) {
              const newUrl = new URL($page.url);
              newUrl.searchParams.set('q', query);
              void goto(newUrl);
            } else {
              void goto(`/search?q=${query}`);
            }
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

    {#if $nowPlaying}
      <div class="mx-1 mb-1">
        <Player nowPlaying={$nowPlaying} />
      </div>
    {/if}
  </div>
</QueryClientProvider>
