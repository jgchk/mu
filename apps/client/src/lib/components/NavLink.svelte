<script lang="ts">
  import { page } from '$app/stores'
  import { cn } from '$lib/utils/classes'

  export let href: string
</script>

<a
  class={cn(
    'rounded px-2 py-1 font-medium transition hover:bg-gray-900',
    $page.url.pathname === href ? 'text-primary-500' : 'text-gray-300 hover:text-white'
  )}
  {href}
>
  <slot />
</a>
