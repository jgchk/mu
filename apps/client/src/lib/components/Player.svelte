<script lang="ts">
  import type { NowPlaying } from '$lib/now-playing';
  import { getContextClient } from '$lib/trpc';

  export let nowPlaying: NowPlaying;

  const trpc = getContextClient();
  $: nowPlayingTrack = trpc.tracks.getById.query({ id: nowPlaying.id });
</script>

<div class="flex items-center gap-4 rounded bg-black p-1">
  {#if $nowPlayingTrack.data}
    {#if $nowPlayingTrack.data.hasCoverArt}
      <img
        class="h-[64px] w-[64px] rounded-sm object-cover"
        src="/api/tracks/{nowPlaying.id}/cover-art?width=128&height=128"
        alt={$nowPlayingTrack.data.title}
      />
    {:else}
      <div class="center h-16 w-16 rounded-sm bg-gray-800 italic text-gray-600">No cover art</div>
    {/if}
    <div>
      <div>{$nowPlayingTrack.data.title}</div>
      <div class="text-sm text-gray-400">
        {$nowPlayingTrack.data.artists
          .sort((a, b) => a.order - b.order)
          .map((artist) => artist.name)
          .join(', ')}
      </div>
    </div>
  {/if}
  {#key nowPlaying.id}
    <audio controls autoplay class="flex-1 bg-transparent">
      <source src="/api/tracks/{nowPlaying.id}/stream" type="audio/mpeg" />
    </audio>
  {/key}
</div>
