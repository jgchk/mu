<script lang="ts">
  import { onDestroy } from 'svelte';
  import { derived } from 'svelte/store';

  import { getContextClient } from '$lib/trpc';

  import type { PageData } from './$types';
  import SoulseekResults from './SoulseekResults.svelte';
  import type { FileSearchResponse } from './types';

  export let data: PageData;
  let oldQuery = data.query;

  const trpc = getContextClient();
  let soulseekData: FileSearchResponse[] = [];
  $: soulseekSubscription = trpc.search.soulseekSubscription.subscription({ query: data.query });
  onDestroy(() => {
    soulseekSubscription.unsubscribe();
  });

  $: {
    if (oldQuery !== data.query) {
      soulseekData = [];
      soulseekSubscription.unsubscribe();
      soulseekSubscription = trpc.search.soulseekSubscription.subscription({ query: data.query });
      oldQuery = data.query;
    }
  }

  let cleanup: () => void | undefined;
  $: {
    cleanup?.();
    const { data } = soulseekSubscription;
    cleanup = derived(data, (value) => value).subscribe((v) => {
      if (v) {
        soulseekData = [...soulseekData, v];
      }
    });
  }
  onDestroy(() => {
    cleanup?.();
  });
</script>

{#if data.hasQuery}
  <SoulseekResults data={soulseekData} />
{:else}
  <div>Enter a search query</div>
{/if}
