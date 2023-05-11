<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { formatMilliseconds } from 'utils'

  import CommaList from '$lib/atoms/CommaList.svelte'
  import IconButton from '$lib/atoms/IconButton.svelte'
  import { makeImageUrl } from '$lib/cover-art'
  import DeleteIcon from '$lib/icons/DeleteIcon.svelte'
  import PlayIcon from '$lib/icons/PlayIcon.svelte'
  import { cn } from '$lib/utils/classes'

  import AddToPlaylistButton from './AddToPlaylistButton.svelte'
  import CoverArt from './CoverArt.svelte'
  import FavoriteButton from './FavoriteButton.svelte'
  import type { TrackListTrack as TrackListTrackType } from './TrackList'
  import TrackListTrackTagsButton from './TrackListTrackTagsButton.svelte'

  export let track: TrackListTrackType
  export let showCoverArt = true
  export let i: number
  export let showDelete = false

  const dispatch = createEventDispatcher<{
    play: undefined
    favorite: undefined
    delete: undefined
  }>()
  const play = () => dispatch('play')
  const favorite = () => dispatch('favorite')
  const delete_ = () => dispatch('delete')
</script>

<div
  class={cn(
    'group/track grid select-none items-center gap-2 rounded p-1.5 hover:bg-gray-700',
    track.release
      ? 'grid-cols-[6fr_auto] sm:grid-cols-[auto_6fr_4fr_1fr_auto]'
      : 'grid-cols-[6fr_auto] sm:grid-cols-[auto_6fr_1fr_auto]'
  )}
  on:dblclick={() => play()}
>
  <div class="hidden sm:block">
    {#if showCoverArt}
      <button type="button" class="relative block h-11 w-11 shadow" on:click={() => play()}>
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
      <div class="center relative h-11 w-8">
        <div class="text-gray-400 group-hover/track:opacity-0">{i + 1}</div>
        <button
          type="button"
          class="hover:text-primary-500 absolute h-6 w-6 opacity-0 transition-colors group-hover/track:opacity-100"
          on:click={() => play()}
        >
          <PlayIcon />
        </button>
      </div>
    {/if}
  </div>

  <div class="overflow-hidden">
    <div class="truncate">{track.title || '[untitled]'}</div>
    <div class="truncate text-sm text-gray-400">
      <CommaList items={track.artists} let:item>
        <a class="hover:underline" href="/artists/{item.id}">{item.name}</a>
      </CommaList>
    </div>
  </div>

  {#if track.release}
    <div class="hidden truncate text-sm text-gray-400 sm:block">
      <a class="hover:underline group-hover/track:text-white" href="/releases/{track.release.id}"
        >{#if track.release.title}
          {track.release.title}
        {:else}
          [untitled]
        {/if}
      </a>
    </div>
  {/if}

  <div class="hidden justify-self-end text-sm text-gray-400 sm:block">
    {formatMilliseconds(track.duration)}
  </div>

  <div class="flex items-center gap-1">
    {#if showDelete}
      <IconButton kind="text" layer={700} tooltip="Remove from playlist" on:click={() => delete_()}>
        <DeleteIcon />
      </IconButton>
    {/if}
    <FavoriteButton layer={700} favorite={track.favorite} on:click={() => favorite()} />
    <AddToPlaylistButton trackId={track.id} layer={700} />
    <TrackListTrackTagsButton trackId={track.id} layer={700} />
  </div>
</div>
