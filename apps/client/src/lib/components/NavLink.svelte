<script lang="ts">
  import { page } from '$app/stores'

  import { cn } from '$lib/utils/classes'

  export let href: string
  export let otherMatches: string[] = []

  $: matches = $page.url.pathname === href || otherMatches.includes($page.url.pathname)
</script>

<a
  class={cn(
    'rounded px-2 py-1 font-medium transition hover:bg-gray-900',
    matches ? 'text-primary-500' : 'text-gray-300 hover:text-white'
  )}
  {href}
>
  <slot />
</a>
