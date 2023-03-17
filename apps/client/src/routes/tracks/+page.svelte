<script lang="ts">
  import { nowPlaying } from '$lib/now-playing';
  import { getContextClient } from '$lib/trpc';

  const trpc = getContextClient();
  const tracksQuery = trpc.tracks.getAll.query();
</script>

{#if $tracksQuery.data}
  <div class="flex flex-wrap gap-4">
    {#each $tracksQuery.data as track (track.id)}
      <div class="w-[200px]">
        <button
          class="relative h-[200px] w-full shadow"
          on:click={() => nowPlaying.set({ id: track.id })}
        >
          {#if track.hasCoverArt}
            <img
              class="h-full w-full rounded object-cover"
              src="/api/tracks/{track.id}/cover-art?width=400&height=400"
              alt={track.title}
            />
          {:else}
            <div class="center h-full w-full rounded bg-gray-800 italic text-gray-600">
              No cover art
            </div>
          {/if}
          <div
            class="center hover:border-primary-500 group absolute top-0 left-0 h-full w-full rounded border border-white border-opacity-20 transition hover:border-opacity-100 hover:bg-gray-900 hover:bg-opacity-60 active:bg-opacity-80"
          />
        </button>
        <div class="truncate text-sm font-bold" title={track.title}>{track.title}</div>
      </div>
    {/each}
  </div>
{:else if $tracksQuery.error}
  <div>{$tracksQuery.error.message}</div>
{:else}
  <div>Loading...</div>
{/if}
