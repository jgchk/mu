<script lang="ts">
  import FlowGrid from '$lib/components/FlowGrid.svelte';
  import { nowPlaying } from '$lib/now-playing';
  import { getContextClient } from '$lib/trpc';

  const trpc = getContextClient();
  const tracksQuery = trpc.tracks.getAll.query();
</script>

{#if $tracksQuery.data}
  <FlowGrid class="p-4">
    {#each $tracksQuery.data as track (track.id)}
      <div class="w-full overflow-hidden">
        <button class="relative w-full shadow" on:click={() => nowPlaying.set({ id: track.id })}>
          {#if track.hasCoverArt}
            <img
              class="w-full rounded object-cover"
              src="/api/tracks/{track.id}/cover-art?width=400&height=400"
              alt={track.title}
            />
          {:else}
            <div class="relative w-full rounded bg-gray-800 pt-[100%] italic text-gray-600">
              <div class="center absolute top-0 left-0 h-full w-full">No cover art</div>
            </div>
          {/if}
          <div
            class="center hover:border-primary-500 group absolute top-0 left-0 h-full w-full rounded border border-white border-opacity-20 transition hover:border-opacity-100 hover:bg-gray-900 hover:bg-opacity-60 active:bg-opacity-80"
          />
        </button>
        <div class="truncate text-sm font-bold" title={track.title}>{track.title}</div>
      </div>
    {/each}
  </FlowGrid>
{:else if $tracksQuery.error}
  <div>{$tracksQuery.error.message}</div>
{:else}
  <div>Loading...</div>
{/if}
