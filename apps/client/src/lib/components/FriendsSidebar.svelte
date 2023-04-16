<script lang="ts">
  import { tooltip } from '$lib/actions/tooltip'
  import LastFmIcon from '$lib/icons/LastFmIcon.svelte'
  import SpotifyIcon from '$lib/icons/SpotifyIcon.svelte'
  import { createLocalStorage } from '$lib/local-storage'
  import { createSystemStatusQuery } from '$lib/services/system'
  import { getContextClient } from '$lib/trpc'
  import { cn } from '$lib/utils/classes'

  import FriendsSidebarLastFm from './FriendsSidebarLastFm.svelte'
  import FriendsSidebarSpotify from './FriendsSidebarSpotify.svelte'

  const trpc = getContextClient()
  const statusQuery = createSystemStatusQuery(trpc)

  type Source = 'lastfm' | 'spotify'

  $: tab = createLocalStorage<Source>(
    'friends-tab',
    $statusQuery.data?.lastFm.status === 'logged-in' ? 'lastfm' : 'spotify'
  )
</script>

<div class="flex w-72 shrink-0 flex-col overflow-hidden rounded bg-gray-900">
  <div class="flex-1 space-y-6 overflow-auto p-4 pt-3">
    {#if $tab === 'lastfm'}
      <FriendsSidebarLastFm />
    {:else if $tab === 'spotify'}
      <FriendsSidebarSpotify />
    {/if}
  </div>

  <div class="flex">
    <button
      type="button"
      class={cn(
        'flex-1 p-2 hover:bg-gray-800 hover:bg-opacity-50',
        $tab === 'lastfm' ? 'text-gray-200' : 'text-gray-600 hover:text-gray-200'
      )}
      on:click={() => tab.set('lastfm')}
      use:tooltip={{ content: 'Last.fm' }}
    >
      <LastFmIcon class="h-4" />
    </button>
    <button
      type="button"
      class={cn(
        'flex-1 p-2 hover:bg-gray-800 hover:bg-opacity-50',
        $tab === 'spotify' ? 'text-gray-200' : 'text-gray-600 hover:text-gray-200'
      )}
      on:click={() => tab.set('spotify')}
      use:tooltip={{ content: 'Spotify' }}
    >
      <SpotifyIcon class="h-4" />
    </button>
  </div>
</div>
