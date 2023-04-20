<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { formatMilliseconds } from 'utils'

  import { makeImageUrl } from '$lib/cover-art'
  import PlayIcon from '$lib/icons/PlayIcon.svelte'

  import AddToPlaylistButton from './AddToPlaylistButton.svelte'
  import CoverArt from './CoverArt.svelte'
  import FavoriteButton from './FavoriteButton.svelte'

  type Track = {
    id: number
    imageId: number | null
    title: string | null
    duration: number
    favorite: boolean
    release?: { id: number; title: string | null } | null
    artists: { id: number; name: string }[]
  }

  export let tracks: Track[]
  let class_: string | undefined = undefined
  export { class_ as class }

  const dispatch = createEventDispatcher<{
    play: { track: Track; i: number }
    favorite: { track: Track; favorite: boolean }
  }>()
  const play = (track: Track, i: number) => dispatch('play', { track, i })
  const favorite = (track: Track) => dispatch('favorite', { track, favorite: !track.favorite })
</script>

<div class={class_}>
  {#each tracks as track, i (track.id)}
    <div
      class="group flex select-none items-center gap-2 rounded p-1.5 hover:bg-gray-700"
      on:dblclick={() => play(track, i)}
    >
      <button type="button" class="relative h-11 w-11 shadow" on:click={() => play(track, i)}>
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
        <div class="flex-[2] truncate text-sm text-gray-400">
          <a class="hover:underline group-hover:text-white" href="/releases/{track.release.id}"
            >{#if track.release.title}
              {track.release.title}
            {:else}
              [untitled]
            {/if}
          </a>
        </div>
      {/if}
      <div class="text-sm text-gray-400">
        {formatMilliseconds(track.duration)}
      </div>
      <div class="flex items-center gap-1">
        <FavoriteButton layer={700} favorite={track.favorite} on:click={() => favorite(track)} />
        <AddToPlaylistButton trackId={track.id} layer={700} />
      </div>
    </div>
  {/each}

  <slot name="footer" />
</div>
