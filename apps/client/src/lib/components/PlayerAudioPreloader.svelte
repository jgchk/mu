<script lang="ts">
  export let trackId: number

  let audio: HTMLAudioElement | undefined

  $: {
    audio = new Audio(`/api/tracks/${trackId}/stream`)
    audio.preload = 'auto'
  }
</script>
