<script lang="ts">
  import { fade } from 'svelte/transition'

  import { page } from '$app/stores'
  import Loader from '$lib/atoms/Loader.svelte'
  import { createSpotifyFriendsQuery } from '$lib/services/friends'
  import { createSystemStatusQuery } from '$lib/services/system'
  import { getContextToast } from '$lib/toast/toast'
  import { getContextClient } from '$lib/trpc'

  import Delay from './Delay.svelte'
  import FriendsSidebarContent from './FriendsSidebarContent.svelte'

  const trpc = getContextClient()
  const statusQuery = createSystemStatusQuery(trpc)

  $: enabled =
    ($statusQuery.data?.spotify.status === 'running' ||
      $statusQuery.data?.spotify.status === 'degraded') &&
    $statusQuery.data.spotify.features.friendActivity

  $: friendsQuery = createSpotifyFriendsQuery(trpc, { enabled })

  let editLink: string
  $: {
    let editUrl = new URL($page.url)
    editUrl.pathname = '/system'
    editUrl.searchParams.set('spotify', 'true')
    editLink = `${editUrl.pathname}${editUrl.search}`
  }

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
        {@const status = $statusQuery.data.spotify}
        {#if status.status === 'stopped'}
          <a class="underline" href={editLink}>Configure Spotify</a>
        {:else if status.status === 'starting'}
          <button
            type="button"
            class="inline underline"
            on:click={() =>
              $statusQuery
                .refetch()
                .then(() => toast.success('Refreshed Spotify status'))
                .catch(() => toast.error('Failed to refresh Spotify status'))}>Refresh</button
          >
          {#if $statusQuery.isFetching}
            <Delay>
              <Loader class="ml-1 inline h-4 w-4" />
            </Delay>
          {/if}
        {:else if status.status === 'errored'}
          <a class="underline" href={editLink}>Fix your Spotify configuration</a>
        {:else if status.status === 'degraded' && !status.features.friendActivity}
          <a class="underline" href={editLink}>Fix your Spotify configuration</a>
        {/if}
      {:else}
        Configure Spotify
      {/if}
      to see your friends
    </div>
  </div>
{/if}
