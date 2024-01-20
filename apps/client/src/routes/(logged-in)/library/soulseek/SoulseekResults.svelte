<script lang="ts">
  import VirtualList from '$lib/atoms/VirtualList.svelte'

  import SoulseekResult from './SoulseekResult.svelte'
  import type { SortedSoulseekResults } from './types'

  export let items: SortedSoulseekResults
</script>

<div class="h-full">
  <VirtualList {items} let:item contentsClass="space-y-1.5">
    <SoulseekResult {item} />
  </VirtualList>
</div>
