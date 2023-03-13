<script lang="ts">
  import { getContextClient } from '$lib/trpc'

  const trpc = getContextClient()
  const tracksQuery = trpc.tracks.getAll.query()
</script>

{#if $tracksQuery.data}
  <div class="flex flex-wrap gap-4">
    {#each $tracksQuery.data as track (track.id)}
      <a href="/releases/{track.id}" class="w-[200px]">
        <div class="relative h-[200px] w-full shadow">
          <img
            class="h-full w-full rounded object-cover"
            src="/api/tracks/{track.id}/cover-art"
            alt={track.title}
          />
          <div
            class="center group absolute top-0 left-0 h-full w-full rounded border border-white border-opacity-20 transition hover:border-primary-500 hover:border-opacity-100 hover:bg-gray-900 hover:bg-opacity-60 active:bg-opacity-80"
          />
        </div>
        <div class="truncate text-sm font-bold" title={track.title}>{track.title}</div>
      </a>
    {/each}
  </div>
{:else if $tracksQuery.error}
  <div>{$tracksQuery.error.message}</div>
{:else}
  <div>Loading...</div>
{/if}
