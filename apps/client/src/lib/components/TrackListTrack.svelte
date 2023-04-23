<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { formatMilliseconds } from 'utils'

  import { makeImageUrl } from '$lib/cover-art'
  import PlayIcon from '$lib/icons/PlayIcon.svelte'

  import AddToPlaylistButton from './AddToPlaylistButton.svelte'
  import CoverArt from './CoverArt.svelte'
  import FavoriteButton from './FavoriteButton.svelte'
  import type { TrackListTrack as TrackListTrackType } from './TrackList'
  import TrackListTrackTags from './TrackListTrackTags.svelte'

  export let track: TrackListTrackType
  export let showCoverArt = true
  export let i: number

  const dispatch = createEventDispatcher<{
    play: undefined
    favorite: undefined
  }>()
  const play = () => dispatch('play')
  const favorite = () => dispatch('favorite')

  let showTags = false
</script>

<div
  class="group flex select-none items-center gap-2 rounded p-1.5 hover:bg-gray-700"
  on:dblclick={() => play()}
  on:mouseenter={() => (showTags = true)}
  on:mouseleave={() => (showTags = false)}
>
  {#if showCoverArt}
    <button type="button" class="relative h-11 w-11 shadow" on:click={() => play()}>
      <CoverArt
        src={track.imageId !== null ? makeImageUrl(track.imageId, { size: 80 }) : undefined}
        alt={track.title}
        iconClass="w-5 h-5"
        placeholderClass="text-[5px]"
        rounding="rounded-sm"
      >
        <PlayIcon />
      </CoverArt>
    </button>
  {:else}
    <div class="center w-8">
      <div class="text-gray-400 group-hover:opacity-0">{i + 1}</div>
      <button
        type="button"
        class="hover:text-primary-500 absolute h-6 w-6 opacity-0 transition-colors group-hover:opacity-100"
        on:click={() => play()}
      >
        <PlayIcon />
      </button>
    </div>
  {/if}
  <div class="flex-1 truncate">
    {track.title || '[untitled]'}
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
  {#if track.release}
    <div class="flex-1 truncate text-sm text-gray-400">
      <a class="hover:underline group-hover:text-white" href="/releases/{track.release.id}"
        >{#if track.release.title}
          {track.release.title}
        {:else}
          [untitled]
        {/if}
      </a>
    </div>
  {/if}
  <div class="flex-1 truncate">
    {#if showTags}
      <TrackListTrackTags trackId={track.id} />
    {/if}
  </div>
  <div class="text-sm text-gray-400">
    {formatMilliseconds(track.duration)}
  </div>
  <div class="flex items-center gap-1">
    <FavoriteButton layer={700} favorite={track.favorite} on:click={() => favorite()} />
    <AddToPlaylistButton trackId={track.id} layer={700} />
  </div>
</div>
