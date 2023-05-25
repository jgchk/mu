<script lang="ts">
  import type { MediaPlayerClass, MediaPlayerFactory } from 'dashjs'
  import { onMount } from 'svelte'

  import { createDashManifestQuery } from '$lib/services/playback'

  let MediaPlayer: (() => MediaPlayerFactory) | undefined = undefined
  onMount(() => import('dashjs').then((res) => (MediaPlayer = res.MediaPlayer)))

  export let trackId: number

  $: manifestQuery = createDashManifestQuery(trackId)

  let preloader: MediaPlayerClass | undefined = undefined
  $: if (MediaPlayer) {
    preloader = MediaPlayer().create()
    preloader.initialize()
    preloader.setAutoPlay(true)
    preloader.updateSettings({
      streaming: { cacheInitSegments: true },
    })
  }

  $: if (preloader && $manifestQuery?.data) {
    preloader.attachSource(`/api/tracks/${trackId}/stream/dash`)
    preloader.preload()
  }
</script>
