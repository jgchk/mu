<script lang="ts">
  import Delay from '$lib/atoms/Delay.svelte'
  import Loader from '$lib/atoms/Loader.svelte'
  import { createLastFmFriendsQuery } from '$lib/services/friends'
  import { createSystemStatusQuery } from '$lib/services/system'
  import { getContextToast } from '$lib/toast/toast'
  import { getContextClient } from '$lib/trpc'
  import { createEditLink } from '$lib/utils/system-config'

  import FriendsSidebarContent from './FriendsSidebarContent.svelte'
  import FullscreenLoader from './FullscreenLoader.svelte'

  const trpc = getContextClient()
  const statusQuery = createSystemStatusQuery(trpc)

  $: enabled = $statusQuery.data?.lastFm.status === 'logged-in'

  $: friendsQuery = createLastFmFriendsQuery(trpc, {
    enabled,
  })

  const editLink = createEditLink('last-fm')

  const toast = getContextToast()
</script>

{#if enabled}
  {#if $friendsQuery.data}
    <FriendsSidebarContent data={$friendsQuery.data} />
  {:else if $friendsQuery.error}
    <div>
      {$friendsQuery.error.message}
    </div>
  {:else}
    <FullscreenLoader />
  {/if}
{:else}
  <div class="flex h-full max-h-72 items-center justify-center">
    <div class="text-center text-gray-600">
      {#if $statusQuery.data}
        {@const status = $statusQuery.data.lastFm}
        {#if status.status === 'stopped'}
          <a class="underline" href={$editLink}>Configure Last.fm</a>
        {:else if status.error}
          <a class="underline" href={$editLink}>Fix your Last.fm configuration</a>
        {:else if status.status === 'authenticating' || status.status === 'logging-in'}
          <button
            type="button"
            class="inline underline"
            on:click={() =>
              $statusQuery
                .refetch()
                .then(() => toast.success('Refreshed Last.fm status'))
                .catch(() => toast.error('Failed to refresh Last.fm status'))}>Refresh</button
          >
          {#if $statusQuery.isFetching}
            <Delay>
              <Loader class="ml-1 inline h-4 w-4" />
            </Delay>
          {/if}
        {:else if status.status === 'authenticated'}
          <a class="underline" href={$editLink}>Configure your Last.fm login</a>
        {/if}
      {:else}
        <a class="underline" href={$editLink}>Configure Last.fm</a>
      {/if}
      to see your friends
    </div>
  </div>
{/if}
