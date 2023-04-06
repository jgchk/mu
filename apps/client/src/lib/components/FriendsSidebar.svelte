<script lang="ts">
  import { tooltip } from '$lib/actions/tooltip'
  import PlayingIcon from '$lib/icons/PlayingIcon.svelte'
  import { getContextClient } from '$lib/trpc'
  import { getTimeSinceShort, toPrettyDate } from '$lib/utils/date'

  const trpc = getContextClient()
  const friendsQuery = trpc.friends.getLastListened.query()
</script>

<div class="w-72 shrink-0 space-y-4 rounded bg-gray-900 p-4">
  {#if $friendsQuery.data}
    {#each $friendsQuery.data as friend}
      <div>
        <div class="mb-1 flex justify-between">
          <a class="text-sm font-semibold text-gray-200 hover:underline" href={friend.friend.url}
            >{friend.friend.name}</a
          >
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
            class="inline-block max-w-[70%] truncate text-gray-400 hover:underline"
            href={friend.lastTrack.url}>{friend.lastTrack.title}</a
          >
          •
          <a
            class="inline-block max-w-[70%] truncate text-gray-400 hover:underline"
            href={friend.lastTrack.artistUrl}>{friend.lastTrack.artist}</a
          >
        </div>
        <a
          class="text-xs text-gray-400 hover:underline"
          href="https://www.last.fm/music/{friend.lastTrack.artist}/{friend.lastTrack.album}"
          >{friend.lastTrack.album}</a
        >
      </div>
    {/each}
  {:else if $friendsQuery.error}
    <div>
      {$friendsQuery.error.message}
    </div>
  {:else}
    <div>Loading friends...</div>
  {/if}
</div>
