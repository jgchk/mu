<script lang="ts">
  import { onDestroy } from 'svelte';

  import PauseIcon from '$lib/icons/PauseIcon.svelte';
  import PlayIcon from '$lib/icons/PlayIcon.svelte';
  import type { NowPlaying } from '$lib/now-playing';
  import { getContextClient } from '$lib/trpc';

  import PlayerCover from './PlayerCover.svelte';
  import Range from './Range.svelte';

  export let nowPlaying: NowPlaying;

  const trpc = getContextClient();
  $: nowPlayingTrack = trpc.tracks.getById.query({ id: nowPlaying.id });

  let player: HTMLAudioElement | undefined;
  let paused = false;
  let currentTime = 0;
  let duration = 1;
  let volume = 1;

  onDestroy(() => {
    player?.pause();
  });

  const togglePlaying = () => {
    if (player?.paused) {
      void player?.play();
    } else {
      player?.pause();
    }
  };
</script>

<div class="flex items-center gap-4 rounded bg-black p-2">
  <div class="flex min-w-[180px] flex-[3] items-center gap-4">
    {#if $nowPlayingTrack.data}
      {#if $nowPlayingTrack.data.hasCoverArt}
        <PlayerCover id={nowPlaying.id} title={$nowPlayingTrack.data.title} />
      {:else}
        <div
          class="center h-[64px] w-[64px] rounded-sm bg-gray-800 text-[8px] italic text-gray-600"
        >
          No cover art
        </div>
      {/if}
      <div class="overflow-hidden">
        <div class="truncate">
          {$nowPlayingTrack.data.title}
        </div>
        <div class="text-sm text-gray-400">
          {$nowPlayingTrack.data.artists
            .sort((a, b) => a.order - b.order)
            .map((artist) => artist.name)
            .join(', ')}
        </div>
      </div>
    {:else if $nowPlayingTrack.error}
      <div>{$nowPlayingTrack.error.message}</div>
    {:else}
      <div class="h-[64px] w-[64px] rounded-sm bg-gray-800" />
      <div>
        <div class="invisible">Loading...</div>
        <div class="invisible text-sm text-gray-400">Loading...</div>
      </div>
    {/if}
  </div>
  <div class="max-w-[722px] flex-[4]">
    <div class="flex w-full justify-center">
      <button
        class="flex h-10 w-10 items-center justify-center transition-transform duration-[50] hover:scale-[1.06] hover:transform active:scale-[.99] active:transform active:transition-none"
        on:click={togglePlaying}
      >
        {#if paused}
          <PlayIcon />
        {:else}
          <PauseIcon />
        {/if}
      </button>
    </div>
    <Range
      bind:value={currentTime}
      min={0}
      max={duration}
      on:change={(e) => {
        if (player) {
          player.currentTime = e.detail;
        }
      }}
    />
  </div>
  <div class="flex flex-[2.25] justify-end">
    <div class="w-[125px]">
      <Range bind:value={volume} min={0} max={1} />
    </div>
  </div>
</div>

{#key nowPlaying.id}
  <audio
    autoplay
    class="hidden"
    bind:this={player}
    bind:currentTime
    bind:duration
    bind:paused
    bind:volume
  >
    <source src="/api/tracks/{nowPlaying.id}/stream" type="audio/mpeg" />
  </audio>
{/key}
