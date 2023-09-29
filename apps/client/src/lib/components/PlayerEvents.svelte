<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte'

  import { player } from '$lib/now-playing'
  import type { NowPlayingEvents } from '$lib/now-playing'

  const dispatch = createEventDispatcher<NowPlayingEvents>()

  onMount(() => {
    player.events.on('*', dispatch)

    return () => {
      player.events.off('*', dispatch)
    }
  })
</script>
