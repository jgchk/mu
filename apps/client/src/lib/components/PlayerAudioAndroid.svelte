<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte'

  const dispatch = createEventDispatcher<{
    timeupdate: number
    durationchange: number
    ended: undefined
  }>()

  export let paused: boolean

  onMount(() => {
    const handleTimeUpdate = (e: AppEventMap['timeupdate']) => dispatch('timeupdate', e.detail)
    const handleDurationChange = (e: AppEventMap['durationchange']) =>
      dispatch('durationchange', e.detail)
    const handlePaused = () => (paused = true)
    const handlePlayed = () => (paused = false)
    const handleEnded = () => dispatch('ended')

    window.addEventListener('timeupdate', handleTimeUpdate)
    window.addEventListener('durationchange', handleDurationChange)
    window.addEventListener('paused', handlePaused)
    window.addEventListener('played', handlePlayed)
    window.addEventListener('ended', handleEnded)

    return () => {
      window.removeEventListener('timeupdate', handleTimeUpdate)
      window.removeEventListener('durationchange', handleDurationChange)
      window.removeEventListener('paused', handlePaused)
      window.removeEventListener('played', handlePlayed)
      window.removeEventListener('ended', handleEnded)
    }
  })
</script>
