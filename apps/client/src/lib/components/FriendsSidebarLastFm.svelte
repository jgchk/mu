<script lang="ts">
  import { fade } from 'svelte/transition'

  import { page } from '$app/stores'
  import Loader from '$lib/atoms/Loader.svelte'
  import { createLastFmFriendsQuery } from '$lib/services/friends'
  import { createSystemStatusQuery } from '$lib/services/system'
  import { getContextClient } from '$lib/trpc'

  import Delay from './Delay.svelte'
  import FriendsSidebarContent from './FriendsSidebarContent.svelte'

  const trpc = getContextClient()
  const statusQuery = createSystemStatusQuery(trpc)

  $: enabled = $statusQuery.data?.lastFm.status === 'logged-in'

  $: friendsQuery = createLastFmFriendsQuery(trpc, {
    enabled,
  })

  let editLink: string
  $: {
    let editUrl = new URL($page.url)
    editUrl.pathname = '/system'
    editUrl.searchParams.set('last-fm', 'true')
    editLink = `${editUrl.pathname}${editUrl.search}`
  }
</script>

{#if enabled}
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
{:else}
  <div class="flex h-full max-h-72 items-center justify-center">
    <div class="text-center text-gray-600">
      <a class="underline" href={editLink}>
        {#if $statusQuery.data}
          {@const status = $statusQuery.data.lastFm.status}
          {#if status === 'stopped'}
            Configure Last.fm
          {:else if status === 'errored'}
            Fix your Last.fm configuration
          {:else if status === 'authenticating'}
            Refresh
          {:else if status === 'authenticated'}
            Configure your Last.fm login
          {:else if status === 'logging-in'}
            Refresh
          {:else if status === 'degraded'}
            Fix your Last.fm configuration
          {/if}
        {:else}
          Configure Last.fm
        {/if}
      </a> to see your friends
    </div>
  </div>
{/if}
