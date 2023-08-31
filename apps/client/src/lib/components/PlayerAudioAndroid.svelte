<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte'

  const dispatch = createEventDispatcher<{ timeupdate: number; durationchange: number }>()

  onMount(() => {
    const handleTimeUpdate = (e: AppEventMap['timeupdate']) => dispatch('timeupdate', e.detail)
    const handleDurationChange = (e: AppEventMap['durationchange']) =>
      dispatch('durationchange', e.detail)

    window.addEventListener('timeupdate', handleTimeUpdate)
    window.addEventListener('durationchange', handleDurationChange)

    return () => {
      window.removeEventListener('timeupdate', handleTimeUpdate)
      window.removeEventListener('durationchange', handleDurationChange)
    }
  })
</script>
