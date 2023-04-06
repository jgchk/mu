<script lang="ts">
  import Loader from '$lib/atoms/Loader.svelte'
  import { getContextClient } from '$lib/trpc'

  import FriendsSidebarContent from './FriendsSidebarContent.svelte'

  const trpc = getContextClient()
  const friendsQuery = trpc.friends.lastFm.query(undefined, {
    refetchInterval: 1000 * 60,
    staleTime: 1000 * 10,
  })
</script>

{#if $friendsQuery.data}
  <FriendsSidebarContent data={$friendsQuery.data} />
{:else if $friendsQuery.error}
  <div>
    {$friendsQuery.error.message}
  </div>
{:else}
  <div class="flex h-full flex-col items-center">
    <div class="h-[40%] max-h-16" />
    <Loader class="h-10 w-10 text-gray-600" />
    <div class="h-[40%] max-h-16" />
  </div>
{/if}
