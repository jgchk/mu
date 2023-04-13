<script lang="ts">
  import { fade } from 'svelte/transition'

  import Loader from '$lib/atoms/Loader.svelte'
  import { createSpotifyFriendsQuery } from '$lib/services/friends'
  import { getContextClient } from '$lib/trpc'

  import Delay from './Delay.svelte'
  import FriendsSidebarContent from './FriendsSidebarContent.svelte'

  const trpc = getContextClient()
  const friendsQuery = createSpotifyFriendsQuery(trpc)
</script>

{#if $friendsQuery.data}
  <FriendsSidebarContent data={$friendsQuery.data} />
{:else if $friendsQuery.error}
  <div>
    {$friendsQuery.error.message}
  </div>
{:else}
  <Delay>
    <div class="flex h-full max-h-72 items-center justify-center" in:fade|local>
      <Loader class="h-10 w-10 text-gray-600" />
    </div>
  </Delay>
{/if}
