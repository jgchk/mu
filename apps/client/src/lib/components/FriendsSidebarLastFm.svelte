<script lang="ts">
  import { fade } from 'svelte/transition'

  import Loader from '$lib/atoms/Loader.svelte'
  import { createLastFmFriendsQuery } from '$lib/services/friends'
  import { createSystemStatusQuery } from '$lib/services/system'
  import { getContextToast } from '$lib/toast/toast'
  import { getContextClient } from '$lib/trpc'
  import { createEditLink } from '$lib/utils/system-config'

  import Delay from './Delay.svelte'
  import FriendsSidebarContent from './FriendsSidebarContent.svelte'

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
    <Delay>
      <div class="flex h-full max-h-72 items-center justify-center" in:fade|local>
        <Loader class="h-10 w-10 text-gray-600" />
      </div>
    </Delay>
  {/if}
{:else}
  <div class="flex h-full max-h-72 items-center justify-center">
    <div class="text-center text-gray-600">
      {#if $statusQuery.data}
        {@const status = $statusQuery.data.lastFm.status}
        {#if status === 'stopped'}
          <a class="underline" href={$editLink}>Configure Last.fm</a>
        {:else if status === 'errored'}
          <a class="underline" href={$editLink}>Fix your Last.fm configuration</a>
        {:else if status === 'authenticating'}
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
        {:else if status === 'authenticated'}
          <a class="underline" href={$editLink}>Configure your Last.fm login</a>
        {:else if status === 'logging-in'}
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
        {:else if status === 'degraded'}
          <a class="underline" href={$editLink}>Fix your Last.fm configuration</a>
        {/if}
      {:else}
        Configure Last.fm
      {/if}
      to see your friends
    </div>
  </div>
{/if}
