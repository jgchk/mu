<script lang="ts">
  import { makeImageUrl } from 'mutils'
  import { createEventDispatcher } from 'svelte'
  import { cn } from 'utils/browser'

  import CommaList from '$lib/atoms/CommaList.svelte'
  import DeleteIcon from '$lib/icons/DeleteIcon.svelte'
  import HeartIcon from '$lib/icons/HeartIcon.svelte'
  import PlusIcon from '$lib/icons/PlusIcon.svelte'
  import TagIcon from '$lib/icons/TagIcon.svelte'
  import TagOutlineIcon from '$lib/icons/TagOutlineIcon.svelte'
  import { createTrackTagMutation } from '$lib/services/tags'
  import { createFavoriteTrackMutation } from '$lib/services/tracks'
  import { getContextClient } from '$lib/trpc'

  import AddToPlaylistPopoverMobile from './AddToPlaylistPopoverMobile.svelte'
  import CoverArt from './CoverArt.svelte'
  import TagsPopoverMobile from './TagsPopoverMobile.svelte'
  import type { TrackListTrack as TrackListTrackType } from './TrackList'

  export let track: TrackListTrackType
  export let showDelete: boolean

  const dispatch = createEventDispatcher<{ close: undefined; delete: undefined }>()

  const trpc = getContextClient()

  const favoriteMutation = createFavoriteTrackMutation(trpc)
  const favorite = () => $favoriteMutation.mutate({ id: track.id, favorite: !track.favorite })

  const tagMutation = createTrackTagMutation(trpc)
  const handleTag = (tagId: number, tagged: boolean) => {
    $tagMutation.mutate({ trackId: track.id, tagId, tagged })
  }

  let state: 'default' | 'edit-tags' | 'add-to-playlist' = 'default'
</script>

<div class="fixed left-0 top-0 z-10 h-full w-full">
  <button
    type="button"
    class="absolute left-0 top-0 h-full w-full cursor-default bg-black bg-opacity-20 backdrop-blur-sm"
    on:click={() => dispatch('close')}
  />

  <div
    class="absolute bottom-0 left-0 w-full rounded-t-lg border border-b-0 border-gray-700 bg-gray-800 p-4"
  >
    {#if state === 'edit-tags'}
      <TagsPopoverMobile
        selectedTagIds={track.tags.map((tag) => tag.id)}
        on:tag={(e) => handleTag(e.detail.id, e.detail.tagged)}
        on:close={() => (state = 'default')}
      />
    {:else if state === 'add-to-playlist'}
      <AddToPlaylistPopoverMobile trackId={track.id} on:close={() => (state = 'default')} />
    {:else}
      <div class="flex items-center gap-3">
        <div class="h-11 w-11">
          <CoverArt
            src={track.imageId !== null ? makeImageUrl(track.imageId, { size: 80 }) : undefined}
            alt={track.title}
            iconClass="w-5 h-5"
            placeholderClass="text-[5px]"
            rounding="rounded-sm"
          />
        </div>

        <div class="overflow-hidden">
          <div class="truncate">{track.title || '[untitled]'}</div>
          <div class="truncate text-sm text-gray-400">
            <CommaList items={track.artists} let:item>
              <a class="hover:underline" href="/library/artists/{item.id}">{item.name}</a>
            </CommaList>
          </div>
        </div>
      </div>

      <div class="mb-3 mt-4 h-px bg-gray-700" />

      <div class="flex flex-col gap-1">
        <button
          type="button"
          class="flex w-full items-center gap-3 rounded p-2.5 hover:bg-gray-800"
          on:click={() => favorite()}
        >
          <HeartIcon class={cn('h-6 w-6', track.favorite && 'text-error-600')} />
          <span class="font-medium text-gray-300">Favorite</span>
        </button>

        {#if showDelete}
          <button
            type="button"
            class="flex w-full items-center gap-3 rounded p-2.5 hover:bg-gray-800"
            on:click={() => dispatch('delete')}
          >
            <DeleteIcon class="h-6 w-6" />
            <span class="font-medium text-gray-300">Remove from playlist</span>
          </button>
        {/if}

        <button
          type="button"
          class="flex w-full items-center gap-3 rounded p-2.5 hover:bg-gray-800"
          on:click={() => (state = 'add-to-playlist')}
        >
          <PlusIcon class="h-6 w-6" />
          <span class="font-medium text-gray-300">Add to playlist</span>
        </button>

        <button
          type="button"
          class="flex w-full items-center gap-3 rounded p-2.5 hover:bg-gray-800"
          on:click={() => (state = 'edit-tags')}
        >
          {#if track.tags.length > 0}
            <TagIcon class="h-6 w-6" />
          {:else}
            <TagOutlineIcon class="h-6 w-6" />
          {/if}
          <span class="font-medium text-gray-300">Edit Tags</span>
        </button>
      </div>
    {/if}
  </div>
</div>
