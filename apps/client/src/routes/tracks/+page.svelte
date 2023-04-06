<script lang="ts">
  import CoverArt from '$lib/components/CoverArt.svelte'
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
          <CoverArt
            src={track.hasCoverArt
              ? `/api/tracks/${track.id}/cover-art?width=80&height=80`
              : undefined}
            alt={track.title}
            iconClass="w-5 h-5"
            placeholderClass="text-[5px]"
            rounding="rounded-sm"
          >
            <PlayIcon />
          </CoverArt>
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
