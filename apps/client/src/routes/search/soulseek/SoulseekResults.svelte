<script lang="ts">
  import VirtualList from '$lib/components/VirtualList.svelte';

  import SoulseekResultFolder from './SoulseekResultFolder.svelte';
  import type { SortedSoulseekResults } from './types';

  export let items: SortedSoulseekResults;
</script>

<div class="h-full">
  <VirtualList {items} let:item let:index>
    <SoulseekResultFolder {item} isLast={index === items.length - 1} />
  </VirtualList>
</div>
