<script lang="ts">
  import { tooltip } from '$lib/actions/tooltip'
  import PlayingIcon from '$lib/icons/PlayingIcon.svelte'
  import SearchIcon from '$lib/icons/SearchIcon.svelte'
  import type { RouterOutput } from '$lib/trpc'
  import { getTimeSinceShort, toPrettyDate } from '$lib/utils/date'

  import CoverArt from './CoverArt.svelte'

  export let data: RouterOutput['friends']['spotify']
</script>

{#each data as friend (friend.friendUrl)}
  <div class="flex gap-2.5">
    <div class="relative top-[0.2rem] h-10 w-10 shrink-0">
      <a href="/search?q={encodeURIComponent(`${friend.artist} - ${friend.album}`)}">
        <CoverArt
          src={friend.art}
          alt={friend.album}
          rounding="rounded-sm"
          iconClass="w-5 h-5"
          placeholderClass="text-[5px]"
        >
          <SearchIcon />
        </CoverArt>
      </a>
    </div>
    <div class="relative min-w-0 flex-1 space-y-1">
      <div class="flex justify-between">
        <a
          class="mr-1 truncate text-sm font-semibold text-gray-300 hover:text-white hover:underline"
          href={friend.friendUrl}
          title={friend.friendName}
        >
          {friend.friendName}
        </a>
        {#if friend.nowPlaying}
          <div class="h-5 w-5 text-gray-400" use:tooltip={{ content: 'Now' }}>
            <PlayingIcon />
          </div>
        {:else}
          <div
            class="select-none text-xs text-gray-400"
            use:tooltip={{ content: toPrettyDate(friend.date) }}
          >
            {getTimeSinceShort(friend.date)}
          </div>
        {/if}
      </div>
      <div class="flex items-center gap-1 whitespace-nowrap text-xs text-white">
        <a
          class="inline-block max-w-[70%] truncate text-gray-400 hover:text-white hover:underline"
          href={friend.url}
          title={friend.title}
        >
          {friend.title}
        </a>
        •
        <a
          class="inline-block max-w-[70%] truncate text-gray-400 hover:text-white hover:underline"
          href={friend.artistUrl}
          title={friend.artist}
        >
          {friend.artist}
        </a>
      </div>
      <div class="w-fit max-w-full truncate text-xs text-gray-400 hover:text-white hover:underline">
        {#if friend.album}
          <a href={friend.albumUrl} title={friend.album}>
            💿 {friend.album}
          </a>
        {:else}
          <a href={friend.url} title={friend.title}>
            🎵 {friend.title}
          </a>
        {/if}
      </div>
    </div>
  </div>
{/each}
