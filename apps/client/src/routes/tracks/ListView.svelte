<script lang="ts">
  import PlayIcon from '$lib/icons/PlayIcon.svelte'
  import { play } from '$lib/now-playing'
  import type { RouterOutput } from '$lib/trpc'

  type Tracks = RouterOutput['tracks']['getAllWithArtistsAndRelease']

  export let tracks: Tracks
</script>

<div class="p-4">
  {#each tracks as track (track.id)}
    <div
      class="group flex select-none items-center gap-2 rounded p-1.5 hover:bg-gray-700"
      on:dblclick={() => play(track.id)}
    >
      <button class="relative w-11 shadow" on:click={() => play(track.id)}>
        {#if track.hasCoverArt}
          <img
            class="w-full rounded object-cover"
            src="/api/tracks/{track.id}/cover-art?width=80&height=80"
            alt={track.title}
          />
        {:else}
          <div class="relative w-full rounded bg-gray-800 pt-[100%] italic text-gray-600">
            <div class="center absolute top-0 left-0 h-full w-full text-[4px]">No cover art</div>
          </div>
        {/if}
        <div
          class="center hover:border-primary-500 group/play absolute top-0 left-0 h-full w-full rounded border border-white border-opacity-20 transition hover:border-opacity-100 hover:bg-gray-900 hover:bg-opacity-60 active:bg-opacity-80"
        >
          <PlayIcon
            size={20}
            class="group-active/play:text-primary-500 text-white opacity-0 transition group-hover:opacity-100"
          />
        </div>
      </button>
      <div class="flex-1 truncate">
        {track.title}
        <ul class="comma-list text-sm text-gray-400">
          {#each track.artists as artist (artist.id)}
            <li class="flex">
              <a class="hover:underline group-hover:text-white" href="/artists/{artist.id}"
                >{artist.name}</a
              >
            </li>
          {/each}
        </ul>
      </div>
      <div class="flex-[2] truncate text-sm text-gray-400">
        {#if track.release}
          <a class="hover:underline group-hover:text-white" href="/releases/{track.release.id}"
            >{#if track.release.title}
              {track.release.title}
            {:else}
              [untitled]
            {/if}
          </a>
        {/if}
      </div>
    </div>
  {/each}
</div>
