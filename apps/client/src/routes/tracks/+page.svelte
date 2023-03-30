<script lang="ts">
  import PlayIcon from '$lib/icons/PlayIcon.svelte'
  import { playTrack } from '$lib/now-playing'
  import { getContextClient } from '$lib/trpc'

  const trpc = getContextClient()
  const tracksQuery = trpc.tracks.getAllWithArtistsAndRelease.query()
</script>

{#if $tracksQuery.data}
  {@const tracks = $tracksQuery.data}
  <div class="p-4">
    {#each tracks as track, i (track.id)}
      <div
        class="group flex select-none items-center gap-2 rounded p-1.5 hover:bg-gray-700"
        on:dblclick={() =>
          playTrack(track.id, {
            previousTracks: tracks.slice(0, i).map((t) => t.id),
            nextTracks: tracks.slice(i + 1).map((t) => t.id),
          })}
      >
        <button
          type="button"
          class="relative h-11 w-11 shadow"
          on:click={() =>
            playTrack(track.id, {
              previousTracks: tracks.slice(0, i).map((t) => t.id),
              nextTracks: tracks.slice(i + 1).map((t) => t.id),
            })}
        >
          {#if track.hasCoverArt}
            <img
              class="h-full w-full rounded object-cover"
              src="/api/tracks/{track.id}/cover-art?width=80&height=80"
              alt={track.title}
            />
          {:else}
            <div class="center h-full w-full rounded bg-gray-800 text-[4px] italic text-gray-600">
              No cover art
            </div>
          {/if}
          <div
            class="center hover:border-primary-500 group/play absolute left-0 top-0 h-full w-full rounded border border-white border-opacity-20 transition hover:border-opacity-100 hover:bg-gray-900 hover:bg-opacity-60 active:bg-opacity-80"
          >
            <PlayIcon
              size={20}
              class="group-active/play:text-primary-500 text-white opacity-0 transition-colors group-hover:opacity-100"
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
{:else if $tracksQuery.error}
  <div>{$tracksQuery.error.message}</div>
{:else}
  <div>Loading...</div>
{/if}
