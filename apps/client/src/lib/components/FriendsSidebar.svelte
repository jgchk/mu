<script lang="ts">
  import { tooltip } from '$lib/actions/tooltip'
  import Loader from '$lib/atoms/Loader.svelte'
  import PlayingIcon from '$lib/icons/PlayingIcon.svelte'
  import { getContextClient } from '$lib/trpc'
  import { getTimeSinceShort, toPrettyDate } from '$lib/utils/date'

  import CoverArt from './CoverArt.svelte'

  const trpc = getContextClient()
  const friendsQuery = trpc.friends.getLastListened.query(undefined, {
    refetchInterval: 1000 * 60,
    staleTime: 1000 * 10,
  })
</script>

<div class="w-72 shrink-0 space-y-6 overflow-auto rounded bg-gray-900 p-4">
  {#if $friendsQuery.data}
    {#each $friendsQuery.data as friend}
      <div class="flex gap-2.5">
        <div class="relative top-[0.2rem] h-10 w-10 shrink-0">
          <CoverArt
            src={friend.lastTrack.art}
            alt={friend.lastTrack.album}
            placeholderClass="text-[5px]"
          />
        </div>
        <div class="relative min-w-0 flex-1 space-y-1">
          <div class="flex justify-between">
            <a
              class="text-sm font-semibold text-gray-300 hover:text-white hover:underline"
              href={friend.friend.url}
              title={friend.friend.name}
            >
              {friend.friend.name}
            </a>
            {#if friend.lastTrack.nowPlaying}
              <div class="h-5 w-5 text-gray-400" use:tooltip={{ content: 'Now' }}>
                <PlayingIcon />
              </div>
            {:else}
              <div
                class="select-none text-xs text-gray-400"
                use:tooltip={{ content: toPrettyDate(friend.lastTrack.date) }}
              >
                {getTimeSinceShort(friend.lastTrack.date)}
              </div>
            {/if}
          </div>
          <div class="flex items-center gap-1 whitespace-nowrap text-xs text-white">
            <a
              class="inline-block max-w-[70%] truncate text-gray-400 hover:text-white hover:underline"
              href={friend.lastTrack.url}
              title={friend.lastTrack.title}
            >
              {friend.lastTrack.title}
            </a>
            •
            <a
              class="inline-block max-w-[70%] truncate text-gray-400 hover:text-white hover:underline"
              href={friend.lastTrack.artistUrl}
              title={friend.lastTrack.artist}
            >
              {friend.lastTrack.artist}
            </a>
          </div>
          <div class="truncate text-xs text-gray-400 hover:text-white hover:underline">
            <a
              href="https://www.last.fm/music/{friend.lastTrack.artist}/{friend.lastTrack.album}"
              title={friend.lastTrack.album}
            >
              💿 {friend.lastTrack.album}
            </a>
          </div>
        </div>
      </div>
    {/each}
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
</div>
