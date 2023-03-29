<script lang="ts">
  import { nowPlaying } from '$lib/now-playing'
  import { getContextClient } from '$lib/trpc'

  import type { PageData } from './$types'

  export let data: PageData

  const trpc = getContextClient()
  const releaseQuery = trpc.releases.getById.query({ id: data.id })
  const tracksQuery = trpc.tracks.getByReleaseIdWithArtists.query({ releaseId: data.id })
</script>

{#if $releaseQuery.data && $tracksQuery.data}
  <h1 class="text-lg font-bold">{$releaseQuery.data.title}</h1>
  <div class="p-4">
    {#each $tracksQuery.data as track (track.id)}
      <div
        class="group flex select-none items-center gap-2 rounded p-1.5 hover:bg-gray-700"
        on:dblclick={() => nowPlaying.set({ id: track.id })}
      >
        <button class="relative w-11 shadow" on:click={() => nowPlaying.set({ id: track.id })}>
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
            class="center hover:border-primary-500 group absolute top-0 left-0 h-full w-full rounded border border-white border-opacity-20 transition hover:border-opacity-100 hover:bg-gray-900 hover:bg-opacity-60 active:bg-opacity-80"
          />
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
      </div>
    {/each}
  </div>
{:else if $releaseQuery.error || $tracksQuery.error}
  <div>{($releaseQuery.error ?? $tracksQuery.error)?.message}</div>
{:else}
  <div>Loading...</div>
{/if}
