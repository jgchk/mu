<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { fade } from 'svelte/transition'
  import { cn } from 'utils/browser'

  import { clickOutside } from '$lib/actions/clickOutside'
  import type { PopperTooltipAction } from '$lib/actions/popper'
  import DeleteIcon from '$lib/icons/DeleteIcon.svelte'
  import HeartIcon from '$lib/icons/HeartIcon.svelte'
  import PlusIcon from '$lib/icons/PlusIcon.svelte'
  import TagIcon from '$lib/icons/TagIcon.svelte'
  import TagOutlineIcon from '$lib/icons/TagOutlineIcon.svelte'
  import { createTrackTagMutation } from '$lib/services/tags'
  import { createFavoriteTrackMutation } from '$lib/services/tracks'
  import { getContextClient } from '$lib/trpc'

  import AddToPlaylistPopoverMobile from './AddToPlaylistPopoverMobile.svelte'
  import PopoverArrow from './PopoverArrow.svelte'
  import TagsPopoverMobile from './TagsPopoverMobile.svelte'
  import type { TrackListTrack as TrackListTrackType } from './TrackList'

  export let popperTooltip: PopperTooltipAction
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

<div
  class="z-40 w-screen max-w-xs rounded-lg border border-gray-600 bg-gray-700 shadow-lg"
  use:popperTooltip={{ modifiers: [{ name: 'offset', options: { offset: [0, 8] } }] }}
  transition:fade|local={{ duration: 75 }}
  use:clickOutside={() => dispatch('close')}
>
  <PopoverArrow />

  <div class="p-2">
    {#if state === 'edit-tags'}
      <TagsPopoverMobile
        selectedTagIds={track.tags.map((tag) => tag.id)}
        on:tag={(e) => handleTag(e.detail.id, e.detail.tagged)}
        on:close={() => (state = 'default')}
      />
    {:else if state === 'add-to-playlist'}
      <AddToPlaylistPopoverMobile trackId={track.id} on:close={() => (state = 'default')} />
    {:else}
      <div class="flex flex-col gap-1">
        <button
          type="button"
          class="flex w-full items-center gap-3 rounded p-1.5 px-2 hover:bg-gray-600"
          on:click={() => favorite()}
        >
          <HeartIcon class={cn('h-5 w-5', track.favorite && 'text-error-600')} />
          <span class="text-sm font-medium text-gray-300">Favorite</span>
        </button>

        {#if showDelete}
          <button
            type="button"
            class="flex w-full items-center gap-3 rounded p-1.5 px-2 hover:bg-gray-600"
            on:click={() => dispatch('delete')}
          >
            <DeleteIcon class="h-5 w-5" />
            <span class="text-sm font-medium text-gray-300">Remove from playlist</span>
          </button>
        {/if}

        <button
          type="button"
          class="flex w-full items-center gap-3 rounded p-1.5 px-2 hover:bg-gray-600"
          on:click={() => (state = 'add-to-playlist')}
        >
          <PlusIcon class="h-5 w-5" />
          <span class="text-sm font-medium text-gray-300">Add to playlist</span>
        </button>

        <button
          type="button"
          class="flex w-full items-center gap-3 rounded p-1.5 px-2 hover:bg-gray-600"
          on:click={() => (state = 'edit-tags')}
        >
          {#if track.tags.length > 0}
            <TagIcon class="h-5 w-5" />
          {:else}
            <TagOutlineIcon class="h-5 w-5" />
          {/if}
          <span class="text-sm font-medium text-gray-300">Edit Tags</span>
        </button>
      </div>
    {/if}
  </div>
</div>
