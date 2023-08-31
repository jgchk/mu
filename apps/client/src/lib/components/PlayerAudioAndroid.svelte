<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte'

  const dispatch = createEventDispatcher<{ timeupdate: number; durationchange: number }>()

  export let paused: boolean

  onMount(() => {
    const handleTimeUpdate = (e: AppEventMap['timeupdate']) => dispatch('timeupdate', e.detail)
    const handleDurationChange = (e: AppEventMap['durationchange']) =>
      dispatch('durationchange', e.detail)
    const handlePaused = (e: AppEventMap['paused']) => (paused = true)
    const handlePlayed = (e: AppEventMap['played']) => (paused = false)

    window.addEventListener('timeupdate', handleTimeUpdate)
    window.addEventListener('durationchange', handleDurationChange)
    window.addEventListener('paused', handlePaused)
    window.addEventListener('played', handlePlayed)

    return () => {
      window.removeEventListener('timeupdate', handleTimeUpdate)
      window.removeEventListener('durationchange', handleDurationChange)
      window.removeEventListener('paused', handlePaused)
      window.removeEventListener('played', handlePlayed)
    }
  })
</script>
