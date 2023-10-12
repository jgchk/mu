<script lang="ts">
  import IconButton from '$lib/atoms/IconButton.svelte'
  import HeartIcon from '$lib/icons/HeartIcon.svelte'
  import HeartOutlineIcon from '$lib/icons/HeartOutlineIcon.svelte'
  import { createFavoriteTrackMutation } from '$lib/services/tracks'
  import { getContextClient } from '$lib/trpc'

  import type { TrackListTrack as TrackListTrackType } from './TrackList'

  export let track: Pick<TrackListTrackType, 'id' | 'favorite'>

  const trpc = getContextClient()
  const favoriteMutation = createFavoriteTrackMutation(trpc)
  const favorite = () => $favoriteMutation.mutate({ id: track.id, favorite: !track.favorite })
</script>

<IconButton
  kind="text"
  tooltip={track.favorite ? 'Unfavorite' : 'Favorite'}
  on:click={() => favorite()}
  layer={700}
>
  {#if track.favorite}
    <HeartIcon class="text-error-600" />
  {:else}
    <HeartOutlineIcon />
  {/if}
</IconButton>
