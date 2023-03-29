<script lang="ts">
  import PlayIcon from '$lib/icons/PlayIcon.svelte'
  import { play } from '$lib/now-playing'
  import { getContextClient } from '$lib/trpc'

  import type { PageData } from './$types'

  export let data: PageData

  const trpc = getContextClient()
  const releaseQuery = trpc.releases.getByIdWithArtists.query({ id: data.id })
  const tracksQuery = trpc.tracks.getByReleaseIdWithArtists.query({ releaseId: data.id })
</script>

{#if $releaseQuery.data && $tracksQuery.data}
  <div class="space-y-4 p-4">
    <div class="flex items-end gap-4">
      <div class="relative w-64 shadow">
        {#if $releaseQuery.data.hasCoverArt}
          <img
            class="w-full rounded object-cover"
            src="/api/releases/{$releaseQuery.data.id}/cover-art?width=512&height=512"
            alt={$releaseQuery.data.title}
          />
        {:else}
          <div class="relative w-full rounded bg-gray-800 pt-[100%] italic text-gray-600">
            <div class="center absolute left-0 top-0 h-full w-full">No cover art</div>
          </div>
        {/if}
        <div
          class="center group absolute left-0 top-0 h-full w-full rounded border border-white border-opacity-20 transition"
        />
      </div>

      <div class="space-y-1 pb-2">
        <h1 class="text-6xl font-bold">{$releaseQuery.data.title}</h1>
        <ul class="comma-list text-sm font-bold">
          {#each $releaseQuery.data.artists as artist (artist.id)}
            <li class="flex">
              <a class="hover:underline group-hover:text-white" href="/artists/{artist.id}"
                >{artist.name}</a
              >
            </li>
          {/each}
        </ul>
      </div>
    </div>

    <div>
      {#each $tracksQuery.data as track (track.id)}
        <div
          class="group flex select-none items-center gap-2 rounded p-1.5 hover:bg-gray-700"
          on:dblclick={() => play(track.id)}
        >
          <div class="center w-8">
            <div class="text-gray-400 group-hover:opacity-0">{track.trackNumber}</div>
            <button
              type="button"
              class="hover:text-primary-500 absolute h-6 w-6 opacity-0 transition-colors group-hover:opacity-100"
              on:click={() => play(track.id)}
            >
              <PlayIcon />
            </button>
          </div>
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
  </div>
{:else if $releaseQuery.error || $tracksQuery.error}
  <div>{($releaseQuery.error ?? $tracksQuery.error)?.message}</div>
{:else}
  <div>Loading...</div>
{/if}
