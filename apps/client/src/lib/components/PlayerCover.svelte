<script lang="ts">
  import { cn } from '$lib/utils/classes'

  export let id: number
  export let title: string | null

  let loaded = false
</script>

<img
  class={cn('h-16 w-16 rounded-sm object-cover', !loaded && 'hidden')}
  src="/api/tracks/{id}/cover-art?width=128&height=128"
  alt={title}
  on:load={() => (loaded = true)}
/>

<div class={cn('h-16 w-16 rounded-sm bg-gray-800', loaded && 'hidden')} />
