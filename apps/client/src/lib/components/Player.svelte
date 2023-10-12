<script lang="ts">
  import { createEventDispatcher } from 'svelte/internal'

  import IconButton from '$lib/atoms/IconButton.svelte'
  import ListIcon from '$lib/icons/ListIcon.svelte'
  import { player } from '$lib/now-playing'
  import type { PlayerState } from '$lib/now-playing'
  import { createNowPlayer, createScrobbler } from '$lib/scrobbler'
  import { createScrobbleMutation, createUpdateNowPlayingMutation } from '$lib/services/playback'
  import { getContextClient } from '$lib/trpc'
  import { cn } from '$lib/utils/classes'

  import PlayerControls from './PlayerControls.svelte'
  import PlayerCurrentTrack from './PlayerCurrentTrack.svelte'
  import PlayerVolume from './PlayerVolume.svelte'

  export let track: NonNullable<PlayerState['track']>
  export let volume: number
  export let queueOpen: boolean

  const trpc = getContextClient()

  const updateNowPlayingMutation = createUpdateNowPlayingMutation(trpc)
  const { mutate: updateNowPlaying } = $updateNowPlayingMutation

  const scrobbleMutation = createScrobbleMutation(trpc)
  const { mutate: scrobble } = $scrobbleMutation

  const scrobbler = createScrobbler((data) => scrobble({ id: data.id, timestamp: data.startTime }))
  $: scrobbler.update($player.track)

  const nowPlayer = createNowPlayer((data) => updateNowPlaying({ id: data.id }))
  $: nowPlayer.update($player.track)

  const dispatch = createEventDispatcher<{ toggleQueue: undefined }>()
  const toggleQueue = () => dispatch('toggleQueue')
</script>

<div class="relative flex items-center gap-4 rounded bg-black p-2 pb-[11px] md:pb-2">
  <PlayerCurrentTrack trackId={track.id} />

  <PlayerControls {track} />

  <div class="hidden items-center justify-end gap-1 md:flex">
    <IconButton
      kind="text"
      tooltip="Queue"
      layer="black"
      class={cn(queueOpen && 'text-primary-600')}
      on:click={toggleQueue}
    >
      <ListIcon />
    </IconButton>
    <PlayerVolume bind:volume />
  </div>
</div>
