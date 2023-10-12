<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { fade } from 'svelte/transition'

  import { clickOutside } from '$lib/actions/clickOutside'
  import { createPopperAction } from '$lib/actions/popper'
  import IconButton from '$lib/atoms/IconButton.svelte'
  import DeleteIcon from '$lib/icons/DeleteIcon.svelte'
  import PlusIcon from '$lib/icons/PlusIcon.svelte'
  import TagIcon from '$lib/icons/TagIcon.svelte'
  import TagOutlineIcon from '$lib/icons/TagOutlineIcon.svelte'
  import { createTrackTagMutation } from '$lib/services/tags'
  import { getContextClient } from '$lib/trpc'

  import AddToPlaylistPopoverMobile from './AddToPlaylistPopoverMobile.svelte'
  import FavoriteButton from './FavoriteButton.svelte'
  import PopoverArrow from './PopoverArrow.svelte'
  import TagsPopoverMobile from './TagsPopoverMobile.svelte'
  import type { TrackListTrack as TrackListTrackType } from './TrackList'

  export let track: TrackListTrackType
  export let showDelete: boolean

  const [editTagsElement, editTagsPopup] = createPopperAction()
  const [addToPlaylistElement, addToPlaylistPopup] = createPopperAction()

  const dispatch = createEventDispatcher<{ delete: undefined }>()

  const trpc = getContextClient()

  const tagMutation = createTrackTagMutation(trpc)
  const handleTag = (tagId: number, tagged: boolean) => {
    $tagMutation.mutate({ trackId: track.id, tagId, tagged })
  }

  let state: 'default' | 'edit-tags' | 'add-to-playlist' = 'default'
</script>

<div class="flex items-center">
  <FavoriteButton {track} />

  {#if showDelete}
    <IconButton
      kind="text"
      tooltip="Remove from playlist"
      on:click={() => dispatch('delete')}
      layer={700}
    >
      <DeleteIcon />
    </IconButton>
  {/if}

  <div use:addToPlaylistElement>
    <IconButton
      kind="text"
      tooltip="Add to playlist"
      on:click={() => (state = 'add-to-playlist')}
      layer={700}
    >
      <PlusIcon />
    </IconButton>
  </div>

  <div use:editTagsElement>
    <IconButton kind="text" tooltip="Edit tags" on:click={() => (state = 'edit-tags')}>
      {#if track.tags.length > 0}
        <TagIcon />
      {:else}
        <TagOutlineIcon />
      {/if}
    </IconButton>
  </div>
</div>

{#if state === 'edit-tags'}
  <div
    class="z-40 w-screen max-w-xs rounded-lg border border-gray-600 bg-gray-700 p-2 shadow-lg"
    use:editTagsPopup={{ modifiers: [{ name: 'offset', options: { offset: [0, 8] } }] }}
    transition:fade|local={{ duration: 75 }}
    use:clickOutside={() => (state = 'default')}
  >
    <PopoverArrow />
    <TagsPopoverMobile
      selectedTagIds={track.tags.map((tag) => tag.id)}
      on:tag={(e) => handleTag(e.detail.id, e.detail.tagged)}
      on:close={() => (state = 'default')}
    />
  </div>
{:else if state === 'add-to-playlist'}
  <div
    class="z-40 w-screen max-w-xs rounded-lg border border-gray-600 bg-gray-700 p-2 shadow-lg"
    use:addToPlaylistPopup={{ modifiers: [{ name: 'offset', options: { offset: [0, 8] } }] }}
    transition:fade|local={{ duration: 75 }}
    use:clickOutside={() => (state = 'default')}
  >
    <PopoverArrow />
    <AddToPlaylistPopoverMobile trackId={track.id} on:close={() => (state = 'default')} />
  </div>
{/if}

<svelte:window
  on:keydown={(e) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      state = 'default'
    }
  }}
/>
