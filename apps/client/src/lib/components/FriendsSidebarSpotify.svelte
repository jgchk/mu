<script lang="ts">
  import { fade } from 'svelte/transition'

  import Loader from '$lib/atoms/Loader.svelte'
  import { createSpotifyFriendsQuery } from '$lib/services/friends'
  import { createStartSpotifyMutation, createSystemStatusQuery } from '$lib/services/system'
  import { getContextToast } from '$lib/toast/toast'
  import { getContextClient } from '$lib/trpc'
  import { createEditLink } from '$lib/utils/system-config'

  import Delay from './Delay.svelte'
  import FriendsSidebarContent from './FriendsSidebarContent.svelte'

  const trpc = getContextClient()
  const toast = getContextToast()

  const statusQuery = createSystemStatusQuery(trpc)
  const startSpotifyMutation = createStartSpotifyMutation(trpc, { toast })

  $: enabled = $statusQuery.data?.spotify.features.webApi
  $: friendsQuery = createSpotifyFriendsQuery(trpc, { enabled })

  const editLink = createEditLink('spotify')
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
      {#if $statusQuery.data?.spotify.status === 'stopped'}
        <button type="button" class="underline" on:click={() => $startSpotifyMutation.mutate()}>
          Start Spotify
        </button>
        {#if $startSpotifyMutation.isLoading}
          <Delay>
            <Loader class="ml-1 inline h-4 w-4" />
          </Delay>
        {/if}
      {:else if $statusQuery.data?.spotify.errors.webApi}
        <a class="underline" href={$editLink}>Fix your Spotify configuration</a>
      {:else}
        <a class="underline" href={$editLink}>Configure Spotify</a>
      {/if}
      to see your friends
    </div>
  </div>
{/if}
